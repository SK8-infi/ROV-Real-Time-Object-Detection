import sys
import os
import cv2
import time
import multiprocessing as mp
import numpy as np
from ultralytics import YOLO
from multiprocessing import shared_memory
import numba
import cupy as cp
from concurrent.futures import ThreadPoolExecutor
import datetime

VIDEO_STREAM_SOURCE = "http://192.168.4.1:81/stream"
MODEL_PATH = "yolo12n.engine"
MODEL_INPUT_SIZE = 320
DISPLAY = True

cv2.setUseOptimized(True)
cv2.setNumThreads(1)

@numba.njit
def box_to_points(x1, y1, x2, y2):
    return np.array([[x1, y1], [x2, y2]], dtype=np.float32)

def frame_reader(shm_name1, shm_name2, shape, dtype, frame_ready, buffer_index):
    cap = cv2.VideoCapture(VIDEO_STREAM_SOURCE)
    if not cap.isOpened():
        print("❌ Failed to open video source")
        return

    shm1 = shared_memory.SharedMemory(name=shm_name1)
    shm2 = shared_memory.SharedMemory(name=shm_name2)
    shared_frame1 = np.ndarray(shape, dtype=dtype, buffer=shm1.buf)
    shared_frame2 = np.ndarray(shape, dtype=dtype, buffer=shm2.buf)

    executor = ThreadPoolExecutor(max_workers=1)

    def preprocess_async(raw):
        return cv2.resize(raw, (shape[1], shape[0]))

    future = None

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        if future is None:
            future = executor.submit(preprocess_async, frame)
            continue

        processed = future.result()
        future = executor.submit(preprocess_async, frame)

        if buffer_index.value == 0:
            np.copyto(shared_frame1, processed)
            buffer_index.value = 1
        else:
            np.copyto(shared_frame2, processed)
            buffer_index.value = 0

        frame_ready.set()

    cap.release()

def yolo_inferencer(shm_name1, shm_name2, shape, dtype, result_queue, frame_ready, buffer_index):
    model = YOLO(MODEL_PATH)
    print("✅ YOLOv8 TensorRT model loaded in subprocess")
    model.predict(np.zeros((MODEL_INPUT_SIZE, MODEL_INPUT_SIZE, 3), dtype=np.uint8), imgsz=MODEL_INPUT_SIZE)

    from norfair import Detection, Tracker
    from norfair.filter import OptimizedKalmanFilterFactory

    tracker = Tracker(
        distance_function="iou",
        distance_threshold=0.5,
        initialization_delay=2,
        hit_counter_max=15,
        filter_factory=OptimizedKalmanFilterFactory()
    )

    shm1 = shared_memory.SharedMemory(name=shm_name1)
    shm2 = shared_memory.SharedMemory(name=shm_name2)
    shared_frame1 = np.ndarray(shape, dtype=dtype, buffer=shm1.buf)
    shared_frame2 = np.ndarray(shape, dtype=dtype, buffer=shm2.buf)

    # Define vertical lines (10% and 90% of width)
    frame_width = shape[1]
    left_line = int(0.1 * frame_width)
    right_line = int(0.9 * frame_width)

    # Open log file in append mode
    log_file_path = "detections_log.txt"
    logged_ids = set()  # Track IDs already logged this run
    passed_count = 0   # Count of unique objects that passed

    while True:
        frame_ready.wait()
        frame_ready.clear()

        if buffer_index.value == 0:
            frame = shared_frame2.copy()
        else:
            frame = shared_frame1.copy()

        start = time.time()
        results = model.predict(source=frame, stream=True, imgsz=MODEL_INPUT_SIZE, conf=0.3, device=0)

        for result in results:
            detections = []
            box_id_to_class = {}
            for i, box in enumerate(result.boxes):
                xyxy = box.xyxy[0].cpu().numpy()
                x1, y1, x2, y2 = map(int, xyxy)
                detections.append(Detection(points=box_to_points(x1, y1, x2, y2)))
                # Get class name if available
                class_id = int(box.cls[0].cpu().numpy()) if hasattr(box, 'cls') else -1
                class_name = result.names[class_id] if class_id in result.names else str(class_id)
                box_id_to_class[i] = class_name

            tracked_objects = tracker.update(detections=detections)

            annotated = result.plot()
            # Draw vertical lines
            cv2.line(annotated, (left_line, 0), (left_line, shape[0]), (0, 0, 255), 2)
            cv2.line(annotated, (right_line, 0), (right_line, shape[0]), (0, 0, 255), 2)
            # Show count of unique objects that passed
            cv2.putText(annotated, f"Passed: {passed_count}", (10, shape[0] - 20),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)

            for tobj in tracked_objects:
                estimate = tobj.estimate.flatten()
                x, y = (estimate[0], estimate[1]) if len(estimate) >= 2 else (estimate[0], estimate[0])
                cv2.putText(annotated, f"ID: {tobj.id}", (int(x), int(y) - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
                cv2.circle(annotated, (int(x), int(y)), 5, (0, 255, 0), -1)

                # Find the class name for this tracked object (best effort)
                class_name = "unknown"
                if hasattr(tobj, 'last_detection') and hasattr(tobj.last_detection, 'points'):
                    # Try to match to detection index
                    for i, det in enumerate(detections):
                        if np.allclose(det.points, tobj.last_detection.points):
                            class_name = box_id_to_class.get(i, "unknown")
                            break

                # Log if detection crosses either vertical line, but only once per ID
                if (int(x) <= left_line or int(x) >= right_line) and tobj.id not in logged_ids:
                    timestamp = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f')
                    log_entry = f"{timestamp} | ID: {tobj.id} | class: {class_name} | x: {int(x)} | y: {int(y)}\n"
                    with open(log_file_path, "a") as logf:
                        logf.write(log_entry)
                        logf.flush()
                    logged_ids.add(tobj.id)
                    passed_count += 1

            latency = (time.time() - start) * 1000
            result_queue.put((annotated, latency))

def main_loop():
    while True:
        try:
            mp.set_start_method('spawn', force=True)
            result_queue = mp.Queue()
            frame_ready = mp.Event()
            buffer_index = mp.Value('i', 0)

            shape = (MODEL_INPUT_SIZE, MODEL_INPUT_SIZE, 3)
            dtype = np.uint8
            nbytes = int(np.prod(shape)) * np.dtype(dtype).itemsize
            shm1 = shared_memory.SharedMemory(create=True, size=nbytes)
            shm2 = shared_memory.SharedMemory(create=True, size=nbytes)

            reader_proc = mp.Process(target=frame_reader, args=(shm1.name, shm2.name, shape, dtype, frame_ready, buffer_index), daemon=True)
            yolo_proc = mp.Process(target=yolo_inferencer, args=(shm1.name, shm2.name, shape, dtype, result_queue, frame_ready, buffer_index), daemon=True)
            reader_proc.start()
            yolo_proc.start()

            win_name = "YOLOv8 Async TRT + Norfair"
            if DISPLAY:
                cv2.namedWindow(win_name, cv2.WINDOW_NORMAL)

            fps_timer = time.time()
            frames = 0
            fps = 0.0

            while True:
                if not result_queue.empty():
                    annotated, latency = result_queue.get()
                    frames += 1

                    now = time.time()
                    time_diff = now - fps_timer
                    if time_diff > 0:
                        fps = 0.9 * fps + 0.1 * (1 / time_diff) if frames > 1 else 0.0
                    fps_timer = now

                    cv2.putText(annotated, f"Latency: {latency:.1f}ms", (10, 30),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 0), 2)
                    cv2.putText(annotated, f"FPS: {fps:.1f}", (10, 60),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)

                    if DISPLAY:
                        cv2.imshow(win_name, annotated)
                        if cv2.waitKey(1) & 0xFF == ord('q'):
                            raise KeyboardInterrupt

        except Exception as e:
            print(f"\n⚠️ Caught exception: {e}\n🔁 Restarting the application...\n")

        finally:
            try:
                reader_proc.terminate()
                yolo_proc.terminate()
                shm1.close()
                shm2.close()
                shm1.unlink()
                shm2.unlink()
                if DISPLAY:
                    cv2.destroyAllWindows()
            except:
                pass
            time.sleep(2)  # optional delay before restarting

if __name__ == "__main__":
    main_loop()
