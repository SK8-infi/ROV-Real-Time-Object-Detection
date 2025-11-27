# Object Detection System Documentation

This module implements real-time object detection and tracking using YOLOv8 with TensorRT acceleration and Norfair for multi-object tracking.

## 📁 Files

- **`camera_detector.py`**: Main detection script with multiprocessing architecture
- **`yolo12n.engine`**: TensorRT-optimized YOLOv8 model (generated from YOLOv8n)
- **`detections_log.txt`**: Log file containing detection events with timestamps
- **`package.json`**: Node.js dependencies (for optional chart visualization)

## 🎯 Overview

The detection system processes video streams from the ESP32S3 camera, performs real-time object detection using YOLOv8, tracks objects across frames using Norfair, and logs detection events when objects cross defined boundaries.

### Key Features

- **Real-time Inference**: YOLOv8 with TensorRT acceleration for GPU-accelerated detection
- **Multi-Object Tracking**: Norfair tracker with Kalman filtering for persistent object IDs
- **Line Crossing Detection**: Tracks objects crossing vertical boundaries (10% and 90% of frame width)
- **Detection Logging**: Automatic logging of detection events with timestamps and metadata
- **Multiprocessing Architecture**: Separate processes for frame reading and inference for optimal performance
- **Shared Memory**: Efficient frame sharing between processes using shared memory

## 🏗️ Architecture

### Process Structure

```
Main Process
├── Frame Reader Process
│   ├── Captures frames from video stream
│   ├── Preprocesses frames (resize)
│   └── Writes to shared memory buffers
│
└── YOLO Inference Process
    ├── Reads frames from shared memory
    ├── Runs YOLOv8 inference
    ├── Tracks objects with Norfair
    ├── Detects line crossings
    ├── Logs detection events
    └── Sends annotated frames to main process
```

### Data Flow

1. **Frame Capture**: Video stream → Frame Reader Process
2. **Preprocessing**: Resize to model input size (320x320)
3. **Shared Memory**: Write to double-buffered shared memory
4. **Inference**: YOLO inference on GPU
5. **Tracking**: Norfair tracker updates object IDs
6. **Detection**: Check for line crossings
7. **Logging**: Write detection events to log file
8. **Display**: Show annotated video (optional)

## ⚙️ Configuration

### Basic Settings

Edit `camera_detector.py`:

```python
# Video stream source
VIDEO_STREAM_SOURCE = "http://192.168.4.1:81/stream"

# Model configuration
MODEL_PATH = "yolo12n.engine"      # TensorRT engine file
MODEL_INPUT_SIZE = 320             # Input image size (320x320)

# Display settings
DISPLAY = True                      # Show video window
```

### Tracking Configuration

Modify tracker parameters in `yolo_inferencer()`:

```python
tracker = Tracker(
    distance_function="iou",                    # Intersection over Union
    distance_threshold=0.5,                     # Matching threshold
    initialization_delay=2,                     # Frames before assigning ID
    hit_counter_max=15,                         # Max frames without detection
    filter_factory=OptimizedKalmanFilterFactory() # Kalman filter
)
```

### Detection Thresholds

Adjust detection parameters:

```python
# In yolo_inferencer function
results = model.predict(
    source=frame,
    stream=True,
    imgsz=MODEL_INPUT_SIZE,
    conf=0.3,          # Confidence threshold (0.0-1.0)
    device=0           # GPU device ID
)
```

### Line Crossing Configuration

Modify boundary lines:

```python
# Define vertical lines (10% and 90% of width)
frame_width = shape[1]
left_line = int(0.1 * frame_width)   # 10% from left
right_line = int(0.9 * frame_width) # 90% from left
```

## 📦 Installation

### Prerequisites

1. **NVIDIA GPU** with CUDA support
2. **CUDA Toolkit** 11.0 or higher
3. **cuDNN** compatible with CUDA version
4. **TensorRT** 8.0 or higher

### Python Dependencies

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install opencv-python
pip install ultralytics
pip install numpy
pip install cupy-cuda11x  # Match your CUDA version
pip install numba
pip install norfair
```

### TensorRT Model Generation

The system uses a TensorRT-optimized model for faster inference. To generate the engine file:

```python
from ultralytics import YOLO

# Load YOLOv8 model
model = YOLO('yolov8n.pt')  # or yolov8s.pt, yolov8m.pt, etc.

# Export to TensorRT
model.export(format='engine', imgsz=320, device=0)

# This creates yolo12n.engine (or similar)
```

**Note**: The model name in the engine file may differ. Update `MODEL_PATH` accordingly.

## 🚀 Usage

### Basic Usage

```bash
cd "Object detection"
python camera_detector.py
```

### Command Line Options

Currently, all configuration is done in the script. To add command-line options:

```python
import argparse

parser = argparse.ArgumentParser()
parser.add_argument('--source', default=VIDEO_STREAM_SOURCE, help='Video stream URL')
parser.add_argument('--model', default=MODEL_PATH, help='Model path')
parser.add_argument('--size', type=int, default=MODEL_INPUT_SIZE, help='Input size')
parser.add_argument('--no-display', action='store_true', help='Disable display')
args = parser.parse_args()
```

### Stopping the System

- Press `q` in the video window to quit
- Or use `Ctrl+C` in the terminal

## 📊 Detection Log Format

Detection events are logged to `detections_log.txt` in the following format:

```
YYYY-MM-DD HH:MM:SS.microseconds | ID: <track_id> | class: <class_name> | x: <x_coord> | y: <y_coord>
```

**Example**:
```
2024-01-15 14:30:25.123456 | ID: 1 | class: person | x: 150 | y: 200
2024-01-15 14:30:26.234567 | ID: 2 | class: car | x: 50 | y: 100
```

### Session Markers

Measurement sessions are marked in the log:

```
=== SESSION_START: 20240115143000 Test Run 1 ===
```

## 🔍 Understanding the Code

### Frame Reader Process

```python
def frame_reader(shm_name1, shm_name2, shape, dtype, frame_ready, buffer_index):
    # Opens video stream
    # Preprocesses frames (resize)
    # Writes to shared memory buffers (double buffering)
    # Signals when frame is ready
```

**Key Features**:
- Double buffering to prevent race conditions
- Async preprocessing using ThreadPoolExecutor
- Automatic frame resizing to model input size

### YOLO Inference Process

```python
def yolo_inferencer(shm_name1, shm_name2, shape, dtype, result_queue, frame_ready, buffer_index):
    # Loads YOLO model
    # Initializes Norfair tracker
    # Reads frames from shared memory
    # Runs inference
    # Tracks objects
    # Detects line crossings
    # Logs detections
    # Sends annotated frames to main process
```

**Key Features**:
- GPU-accelerated inference
- Persistent object tracking
- Line crossing detection
- Automatic logging

### Main Loop

```python
def main_loop():
    # Creates shared memory buffers
    # Starts frame reader and inference processes
    # Displays annotated video
    # Handles errors and restarts
```

**Key Features**:
- Automatic error recovery
- FPS calculation and display
- Latency monitoring
- Graceful shutdown

## 🎨 Visualization

The system displays:
- **Bounding boxes**: Around detected objects
- **Object IDs**: Assigned by tracker
- **Class labels**: Object class names
- **Vertical lines**: Boundary lines (red)
- **Passed count**: Number of objects that crossed boundaries
- **FPS**: Current frames per second
- **Latency**: Inference latency in milliseconds

## ⚡ Performance Optimization

### Model Selection

- **YOLOv8n (nano)**: Fastest, lower accuracy
- **YOLOv8s (small)**: Balanced
- **YOLOv8m (medium)**: Better accuracy, slower
- **YOLOv8l/l (large/xlarge)**: Best accuracy, slowest

### Input Size

- **320x320**: Fastest, lower accuracy
- **640x640**: Balanced (default YOLOv8)
- **1280x1280**: Best accuracy, slowest

### GPU Optimization

1. **TensorRT**: Use TensorRT engine files (already implemented)
2. **Batch Size**: Currently 1, can be increased for batch processing
3. **FP16/INT8**: Use lower precision for faster inference

### CPU Optimization

1. **Thread Count**: Adjust `cv2.setNumThreads(1)` if needed
2. **OpenCV Optimization**: `cv2.setUseOptimized(True)` (already enabled)
3. **Numba JIT**: Used for box conversion (already implemented)

## 🐛 Troubleshooting

### Model Not Loading

**Error**: `FileNotFoundError: yolo12n.engine`

**Solution**:
1. Generate the TensorRT engine file (see Installation)
2. Verify `MODEL_PATH` points to the correct file
3. Check file permissions

### CUDA Out of Memory

**Error**: `RuntimeError: CUDA out of memory`

**Solutions**:
1. Reduce `MODEL_INPUT_SIZE` (e.g., 320 → 256)
2. Use smaller model (YOLOv8n instead of YOLOv8s)
3. Close other GPU applications
4. Reduce batch size

### Video Stream Not Accessible

**Error**: `Failed to open video source`

**Solutions**:
1. Verify camera is powered and connected
2. Check `VIDEO_STREAM_SOURCE` URL is correct
3. Test stream URL in browser
4. Check network connectivity
5. Verify ESP32S3 is streaming

### Low FPS

**Solutions**:
1. Reduce input size (320 → 256)
2. Use smaller model (YOLOv8n)
3. Lower confidence threshold
4. Disable display (`DISPLAY = False`)
5. Check GPU utilization
6. Verify TensorRT is being used

### Tracking Issues

**Problem**: Objects losing IDs frequently

**Solutions**:
1. Increase `hit_counter_max` (e.g., 15 → 30)
2. Adjust `distance_threshold` (e.g., 0.5 → 0.7)
3. Reduce `initialization_delay` (e.g., 2 → 1)
4. Check camera frame rate

**Note**: Actual performance depends on:
- GPU model
- Input resolution
- Number of detected objects
- Camera frame rate

## 🔐 Security Considerations

- **Log File**: Contains detection data, consider encryption for sensitive applications
- **Network Stream**: Video stream is unencrypted, use VPN for remote access
- **File Permissions**: Ensure log file has appropriate permissions

## 📚 Additional Resources

- [Ultralytics YOLO Documentation](https://docs.ultralytics.com/)
- [Norfair Documentation](https://github.com/tryolabs/norfair)
- [TensorRT Developer Guide](https://docs.nvidia.com/deeplearning/tensorrt/)
- [OpenCV Documentation](https://docs.opencv.org/)

## 🔄 Future Enhancements

Potential improvements:
- [ ] Support for multiple camera streams
- [ ] Custom YOLO model training
- [ ] Database integration for logging
- [ ] Real-time alerts/notifications
- [ ] Web-based visualization
- [ ] Export detection data to CSV/JSON
- [ ] Support for video file input
- [ ] Batch processing mode

