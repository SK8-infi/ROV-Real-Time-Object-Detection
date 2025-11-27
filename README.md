# ROV Real-Time Object Detection System

A comprehensive Remotely Operated Vehicle (ROV) system with real-time object detection, tracking, and control capabilities. This project integrates embedded systems (ESP8266, ESP32S3), computer vision (YOLOv8), and a modern web interface for complete ROV operation.

## 📋 Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Features](#features)
- [Project Structure](#project-structure)
- [Hardware Requirements](#hardware-requirements)
- [Software Requirements](#software-requirements)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

This project implements a complete ROV control and monitoring system that combines:

- **Embedded Control**: ESP8266-based motor and servo control
- **Video Streaming**: ESP32S3 camera module for live video feed
- **Object Detection**: Real-time YOLOv8 inference with TensorRT acceleration
- **Object Tracking**: Multi-object tracking using Norfair with Kalman filtering
- **Web Interface**: React-based control dashboard with real-time visualization
- **Data Logging**: Automatic detection logging with session management

The system is designed for real-time operation with low latency, making it suitable for applications requiring immediate feedback and control.

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React Frontend (Web UI)                   │
│  - Control Interface  - Detection Charts  - Camera Feed    │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTP/WebSocket
┌───────────────────────▼─────────────────────────────────────┐
│              FastAPI Backend (rov_backend.py)               │
│  - Command Routing  - WebSocket Bridge  - Log Management    │
└───────┬───────────────────────────────┬────────────────────┘
        │                               │
        │ WebSocket                     │ HTTP
        │                               │
┌───────▼──────────┐         ┌──────────▼──────────────┐
│  ESP8266 Motor   │         │  ESP32S3 Camera Module  │
│  Controller      │         │  (Video Stream Server)  │
└──────────────────┘         └──────────┬───────────────┘
                                       │ MJPEG Stream
                            ┌──────────▼───────────────┐
                            │  Object Detection        │
                            │  (camera_detector.py)     │
                            │  - YOLOv8 TensorRT        │
                            │  - Norfair Tracking        │
                            │  - Detection Logging      │
                            └──────────────────────────┘
```

### Component Communication Flow

1. **Control Flow**: User → React UI → FastAPI → ESP8266 → Motors/Servos
2. **Video Flow**: ESP32S3 → MJPEG Stream → Object Detection → Annotated Video
3. **Data Flow**: Object Detection → Log File → FastAPI → React UI (Charts)

## ✨ Features

### Control Features
- **Real-time Joystick Control**: 8-directional movement with adjustable speed
- **Path Planning**: Visual grid-based path planner with automatic execution
- **Pan/Tilt Camera Control**: Interactive control for camera positioning
- **Movement Settings**: Configurable forward/backward and turn speeds/durations
- **Button Controls**: Direct forward, backward, left, right, and stop commands

### Detection Features
- **Real-time Object Detection**: YOLOv8 model with TensorRT acceleration
- **Multi-Object Tracking**: Persistent tracking across frames using Norfair
- **Detection Logging**: Automatic logging of detected objects with timestamps
- **Session Management**: Organize detections into measurement sessions
- **Visualization**: Pie charts showing detection statistics by object type
- **Line Crossing Detection**: Tracks objects crossing defined vertical boundaries

### Interface Features
- **Draggable UI Cards**: Customizable dashboard layout
- **Live Camera Feed**: MJPEG stream display with configurable URL
- **Real-time Statistics**: FPS, latency, and detection counts
- **WebSocket Telemetry**: Real-time status updates from ROV
- **Responsive Design**: Works on desktop and mobile devices

## 📁 Project Structure

```
ROV-Real-Time-Object-Detection/
│
├── ARDUINO/                          # Embedded firmware
│   ├── ESP8266/                      # Motor and servo controller
│   │   └── sketch_apr2a/
│   │       └── sketch_apr2a.ino       # Main control firmware
│   │
│   └── XIAO ESP32S3/                 # Camera module
│       └── CameraWebServer/
│           ├── CameraWebServer.ino   # Camera server firmware
│           ├── app_httpd.cpp         # HTTP server implementation
│           ├── camera_pins.h         # Camera pin definitions
│           └── partitions.csv        # ESP32 partition table
│
├── Object detection/                  # Computer vision module
│   ├── camera_detector.py            # Main detection script
│   ├── yolo12n.engine                # TensorRT model (generated)
│   ├── detections_log.txt             # Detection log file
│   └── package.json                   # Node dependencies (for charts)
│
├── REACT+API/                        # Web application
│   ├── rov_backend.py                # FastAPI backend server
│   └── rov_frontend/                 # React frontend
│       ├── src/
│       │   ├── App.js                 # Main application component
│       │   ├── DetectionPieChart.jsx  # Detection visualization
│       │   ├── Animations/            # UI animation components
│       │   └── Backgrounds/           # Background effects
│       ├── public/                    # Static assets
│       └── package.json               # Frontend dependencies
│
└── LICENSE                            # GPL v3 License

```

For detailed information about each component, see:
- [ARDUINO/README.md](ARDUINO/README.md) - Embedded firmware documentation
- [Object detection/README.md](Object%20detection/README.md) - Detection system documentation
- [REACT+API/README.md](REACT+API/README.md) - Web application documentation

## 🔧 Hardware Requirements

### ROV Base Unit
- **ESP8266 Development Board** (e.g., NodeMCU, Wemos D1 Mini)
- **Motor Driver** (L298N or similar)
- **2x DC Motors** for movement
- **2x Servo Motors** for pan/tilt camera mount
- **Power Supply** (7-12V for motors, 5V for ESP8266)

### Camera Module
- **ESP32S3 Development Board** (XIAO ESP32S3 or similar)
- **Camera Module** compatible with ESP32 (OV2640, OV3660, or OV5640)
- **PSRAM** (recommended for better performance)

### Control Station
- **Computer** with:
  - NVIDIA GPU (for TensorRT acceleration)
  - CUDA Toolkit 11.0+
  - Python 3.8+
  - Node.js 16+ (for frontend)

## 💻 Software Requirements

### Python Dependencies
- Python 3.8 or higher
- OpenCV (cv2)
- Ultralytics YOLO
- TensorRT
- NumPy
- CuPy (for GPU acceleration)
- Numba
- Norfair (for object tracking)
- FastAPI
- WebSockets
- Uvicorn

### Node.js Dependencies
- Node.js 16+ and npm
- React 18+
- Material-UI (MUI)
- Recharts
- Axios

### Arduino IDE Requirements
- Arduino IDE 1.8+ or PlatformIO
- ESP8266 Board Support Package
- ESP32 Board Support Package
- Required Libraries:
  - WebSocketsServer (for ESP8266)
  - ArduinoJson
  - Servo

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ROV-Real-Time-Object-Detection
```

### 2. Install Python Dependencies

```bash
# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install opencv-python ultralytics numpy cupy numba norfair fastapi websockets uvicorn
```

### 3. Install Node.js Dependencies

```bash
cd REACT+API/rov_frontend
npm install
```

### 4. Flash Arduino Firmware

See [ARDUINO/README.md](ARDUINO/README.md) for detailed instructions on flashing the ESP8266 and ESP32S3 firmware.

## ⚙️ Configuration

### Network Configuration

The system uses a WiFi Access Point (AP) mode. Configure the following:

**ESP32S3 Camera (Access Point)**:
- SSID: `ESP32-CAM` (default)
- Password: `123456789` (default)
- IP: `192.168.4.1` (default)

**ESP8266 Motor Controller**:
- Connects to ESP32-CAM network
- Static IP: `192.168.4.2` (or 3, 4, 5 for multiple ROVs)
- WebSocket Port: `81`

### Object Detection Configuration

Edit `Object detection/camera_detector.py`:

```python
VIDEO_STREAM_SOURCE = "http://192.168.4.1:81/stream"  # Camera stream URL
MODEL_PATH = "yolo12n.engine"                          # TensorRT model path
MODEL_INPUT_SIZE = 320                                 # Input image size
DISPLAY = True                                         # Show video window
```

### Backend Configuration

Edit `REACT+API/rov_backend.py`:

```python
CAR_IPS = ["192.168.4.2", "192.168.4.3", "192.168.4.4", "192.168.4.5"]  # ROV IPs
CAR_PORT = 81                                                             # WebSocket port
LOG_FILE_PATH = "detections_log.txt"                                     # Log file path
```

### Frontend Configuration

Edit `REACT+API/rov_frontend/src/App.js`:

```javascript
const API_URL = 'http://localhost:8000';  // Backend API URL
```

## 🎮 Usage

### Starting the System

1. **Start the Backend Server**:
```bash
cd REACT+API
python rov_backend.py
# Or with uvicorn:
uvicorn rov_backend:app --host 0.0.0.0 --port 8000
```

2. **Start the Frontend**:
```bash
cd REACT+API/rov_frontend
npm start
```

3. **Start Object Detection**:
```bash
cd "Object detection"
python camera_detector.py
```

4. **Access the Web Interface**:
   - Open browser to `http://localhost:3000`
   - The ROV controller interface will load

### Basic Operations

#### Controlling the ROV

1. **Joystick Control**: Use the joystick card to control movement in real-time
2. **Path Planning**: 
   - Click dots on the grid to create a path
   - Click "Start" to execute the path automatically
3. **Pan/Tilt**: Drag the pointer in the pan/tilt box to adjust camera angle
4. **Movement Settings**: Adjust speed and duration sliders for fine control

#### Viewing Detections

1. **Detection Chart**: View pie chart of detected object types
2. **Session Management**: Start new measurement sessions with labels
3. **Log Viewing**: Detection logs are automatically updated in real-time

## 📡 API Documentation

### Backend Endpoints

#### POST `/command`
Send movement command to ROV.

**Request Body**:
```json
{
  "left": 150,    // Left motor speed (-255 to 255)
  "right": -150,  // Right motor speed (-255 to 255, typically inverted)
  "pan": 90,      // Pan angle (0-180)
  "tilt": 90      // Tilt angle (0-180)
}
```

**Response**:
```json
{
  "ok": true
}
```

#### WebSocket `/ws`
Real-time bidirectional communication with ROV.

**Messages**: JSON strings with status updates from ROV.

#### POST `/start-log-session`
Start a new detection logging session.

**Response**:
```json
{
  "ok": true,
  "start_pos": 1234
}
```

#### GET `/log-entries`
Get new log entries since last session start.

**Response**:
```json
{
  "ok": true,
  "entries": "2024-01-01 12:00:00.123 | ID: 1 | class: person | x: 100 | y: 200\n..."
}
```

#### POST `/end-log-session`
End current logging session.

#### POST `/start-measurement`
Start a new measurement session with optional label.

**Request Body**:
```json
{
  "label": "Test Run 1"
}
```

**Response**:
```json
{
  "ok": true,
  "session_id": "20240101120000"
}
```

## 🔍 Troubleshooting

### Common Issues

#### Camera Stream Not Working
- Verify ESP32S3 is powered and connected
- Check WiFi connection to `ESP32-CAM` network
- Verify camera stream URL in detection script
- Check camera module connections

#### ROV Not Responding to Commands
- Verify ESP8266 is connected to WiFi network
- Check WebSocket connection in backend logs
- Verify motor driver connections
- Check power supply voltage

#### Object Detection Not Running
- Verify NVIDIA GPU and CUDA are installed
- Check TensorRT model file exists
- Verify camera stream is accessible
- Check GPU memory availability

#### Frontend Not Connecting
- Verify backend server is running on port 8000
- Check CORS settings in backend
- Verify API_URL in frontend code
- Check browser console for errors

### Performance Optimization

1. **Reduce Model Input Size**: Lower `MODEL_INPUT_SIZE` for faster inference
2. **Adjust Confidence Threshold**: Modify `conf` parameter in YOLO predict call
3. **Disable Display**: Set `DISPLAY = False` to reduce CPU usage
4. **Optimize Network**: Use wired connection for lower latency

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Ultralytics YOLO](https://github.com/ultralytics/ultralytics) for object detection
- [Norfair](https://github.com/tryolabs/norfair) for object tracking
- [FastAPI](https://fastapi.tiangolo.com/) for the backend framework