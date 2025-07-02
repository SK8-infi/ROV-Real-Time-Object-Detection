import asyncio
import websockets
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, Body
from fastapi.middleware.cors import CORSMiddleware
import os
import datetime

app = FastAPI()
origins = ["*"]  # For dev, allow all. Restrict in production!
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_methods=["*"], allow_headers=["*"])

CAR_IPS = ["192.168.4.2", "192.168.4.3", "192.168.4.4", "192.168.4.5"]
CAR_PORT = 81

LOG_FILE_PATH = "detections_log.txt"
log_session_start = {"pos": 0}

class CarBridge:
    def __init__(self):
        self.ws = None
        self.connected = False
        self.status = "Disconnected"
        self.recv_queue = asyncio.Queue()
        self.loop = asyncio.get_event_loop()
        self.loop.create_task(self._connect_loop())

    async def _connect_loop(self):
        while True:
            for ip in CAR_IPS:
                try:
                    ws_uri = f"ws://{ip}:{CAR_PORT}"
                    self.ws = await websockets.connect(ws_uri)
                    self.connected = True
                    self.status = f"Connected to {ws_uri}"
                    await self._recv_loop()
                except Exception as e:
                    self.connected = False
                    self.status = f"Connection failed: {e}"
                    await asyncio.sleep(1)
            await asyncio.sleep(5)

    async def _recv_loop(self):
        try:
            async for message in self.ws:
                await self.recv_queue.put(message)
        except Exception:
            self.connected = False
            self.status = "Disconnected"
            self.ws = None

    async def send(self, cmd):
        if self.ws and self.connected:
            await self.ws.send(json.dumps(cmd))

car_bridge = CarBridge()

@app.post("/command")
async def send_command(cmd: dict):
    await car_bridge.send(cmd)
    return {"ok": True}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            msg = await car_bridge.recv_queue.get()
            await websocket.send_text(msg)
    except WebSocketDisconnect:
        pass

@app.post("/start-log-session")
async def start_log_session():
    try:
        with open(LOG_FILE_PATH, "rb") as f:
            f.seek(0, os.SEEK_END)
            log_session_start["pos"] = f.tell()
        return {"ok": True, "start_pos": log_session_start["pos"]}
    except Exception as e:
        return {"ok": False, "error": str(e)}

@app.get("/log-entries")
async def get_log_entries():
    try:
        with open(LOG_FILE_PATH, "r", encoding="utf-8") as f:
            f.seek(log_session_start["pos"])
            new_entries = f.read()
            log_session_start["pos"] = f.tell()
        return {"ok": True, "entries": new_entries}
    except Exception as e:
        return {"ok": False, "error": str(e)}

@app.post("/end-log-session")
async def end_log_session():
    log_session_start["pos"] = 0
    return {"ok": True}

@app.post("/start-measurement")
async def start_measurement(label: str = Body("", embed=True)):
    session_id = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
    marker = f"=== SESSION_START: {session_id} {label} ===\n"
    with open(LOG_FILE_PATH, "a") as logf:
        logf.write(marker)
    return {"ok": True, "session_id": session_id} 