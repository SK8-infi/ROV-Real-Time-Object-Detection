# Web Application Documentation

This directory contains the web application components: the FastAPI backend server and the React frontend interface.

## 📁 Directory Structure

```
REACT+API/
├── rov_backend.py              # FastAPI backend server
└── rov_frontend/               # React frontend application
    ├── src/
    │   ├── App.js              # Main application component
    │   ├── DetectionPieChart.jsx # Detection visualization
    │   ├── Animations/          # UI animation components
    │   │   └── ClickSpark/
    │   └── Backgrounds/         # Background effects
    │       └── Particles/
    ├── public/                  # Static assets
    ├── package.json             # Frontend dependencies
    └── README.md                # Frontend-specific README
```

## 🔧 Backend (FastAPI)

### Overview

The backend server (`rov_backend.py`) provides:
- REST API for ROV command control
- WebSocket bridge to ESP8266 controllers
- Detection log management
- Session management for measurements

### Features

- **Command Routing**: Sends movement commands to ROVs via WebSocket
- **Multi-ROV Support**: Can connect to multiple ROVs (IPs: 192.168.4.2-5)
- **Log Management**: Reads and serves detection log entries
- **Session Management**: Tracks measurement sessions with labels
- **CORS Support**: Configured for development (allow all origins)

### API Endpoints

#### POST `/command`

Send movement command to ROV.

**Request**:
```json
{
  "left": 150,
  "right": -150,
  "pan": 90,
  "tilt": 90
}
```

**Response**:
```json
{
  "ok": true
}
```

#### WebSocket `/ws`

Real-time bidirectional communication.

**Client → Server**: Not used (commands via POST /command)

**Server → Client**: JSON messages from ROV
```json
{
  "pan": 90,
  "tilt": 90
}
```

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

Get new log entries since session start.

**Response**:
```json
{
  "ok": true,
  "entries": "2024-01-01 12:00:00.123 | ID: 1 | class: person | x: 100 | y: 200\n..."
}
```

#### POST `/end-log-session`

End current logging session.

**Response**:
```json
{
  "ok": true
}
```

#### POST `/start-measurement`

Start a new measurement session with label.

**Request**:
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

### Configuration

Edit `rov_backend.py`:

```python
# ROV IP addresses
CAR_IPS = ["192.168.4.2", "192.168.4.3", "192.168.4.4", "192.168.4.5"]
CAR_PORT = 81

# Log file path (relative to backend directory)
LOG_FILE_PATH = "detections_log.txt"

# CORS settings (for production, restrict origins)
origins = ["*"]  # Development: allow all
```

### Installation

```bash
# Install dependencies
pip install fastapi uvicorn websockets
```

### Running the Backend

```bash
# Direct execution
python rov_backend.py

# Or with uvicorn
uvicorn rov_backend:app --host 0.0.0.0 --port 8000 --reload
```

The server will start on `http://localhost:8000`

### CarBridge Class

The `CarBridge` class manages WebSocket connections to ROVs:

```python
class CarBridge:
    def __init__(self):
        self.ws = None
        self.connected = False
        self.status = "Disconnected"
        self.recv_queue = asyncio.Queue()
    
    async def _connect_loop(self):
        # Attempts to connect to ROVs in CAR_IPS list
        # Automatically reconnects on failure
    
    async def send(self, cmd):
        # Sends command to connected ROV
```

### Log File Management

The backend reads from `detections_log.txt` (created by the detection system). The log file path is relative to where the backend is run from.

**Note**: Ensure the detection system and backend are configured to use the same log file path.

## 🎨 Frontend (React)

### Overview

The React frontend provides a modern, interactive control interface for the ROV system with:
- Real-time control (joystick, buttons, path planner)
- Camera feed display
- Detection visualization
- Draggable, customizable UI cards

### Features

#### Control Components

1. **Joystick Card**: 8-directional real-time control
2. **Path Planner**: Grid-based path planning with automatic execution
3. **Pan/Tilt Control**: Interactive camera positioning
4. **Movement Settings**: Adjustable speed and duration
5. **Button Controls**: Direct movement commands

#### Visualization Components

1. **Camera Feed**: Live MJPEG stream display
2. **Detection Chart**: Pie chart of detected object types
3. **Session Management**: Create and view measurement sessions

#### UI Features

- **Draggable Cards**: Customize dashboard layout
- **Lock/Unlock**: Prevent accidental card movement
- **Persistent Layout**: Saves to localStorage
- **Responsive Design**: Works on desktop and mobile
- **Modern UI**: Material-UI components with space theme

### Installation

```bash
cd rov_frontend
npm install
```

### Running the Frontend

```bash
npm start
```

The application will open at `http://localhost:3000`

### Configuration

Edit `src/App.js`:

```javascript
const API_URL = 'http://localhost:8000';  // Backend API URL
```

### Component Structure

#### Main App Component (`App.js`)

- Manages all UI cards and their state
- Handles WebSocket connection for telemetry
- Manages detection log sessions
- Coordinates all control components

#### Card Components

1. **JoystickCard**: Real-time joystick control
2. **PathPlannerCard**: Grid-based path planning
3. **PanTiltBox**: Camera pan/tilt control
4. **CameraFeedCard**: Video stream display
5. **DetectionPieChart**: Detection statistics

### State Management

The app uses React hooks for state management:
- `useState`: Component state
- `useEffect`: Side effects (API calls, WebSocket)
- `useRef`: Refs for drag handling
- `localStorage`: Persistent card layout and settings

### Card Types

Available card types (defined in `CARD_TYPES`):

- `move`: Movement settings (speed, duration)
- `pan`: Pan/tilt camera control
- `ctrl`: Button controls (forward, backward, etc.)
- `msg`: Messages from ROV
- `path`: Path planner
- `joy`: Joystick control
- `cam`: Camera feed
- `chart`: Detection chart

### Default Layout

Cards are positioned with default coordinates:
- Movement Settings: Top-left
- Pan & Tilt: Bottom-left
- Controls: Top-right
- Messages: Bottom-right
- Path Planner: Top-center-left
- Joystick: Bottom-center
- Camera Feed: Top-center-right
- Detection Chart: Top-center

### LocalStorage Keys

- `rov_cards`: Card layout and state
- `rov_cam_url`: Camera feed URL
- `rov_path_planner`: Path planner state

### API Integration

The frontend communicates with the backend via:

1. **REST API** (Axios):
   - `POST /command`: Send movement commands
   - `GET /log-entries`: Fetch detection logs
   - `POST /start-log-session`: Start logging session
   - `POST /end-log-session`: End logging session
   - `POST /start-measurement`: Start measurement session

2. **WebSocket**:
   - `ws://localhost:8000/ws`: Real-time telemetry

### Building for Production

```bash
npm run build
```

This creates an optimized production build in the `build/` directory.

## 🔄 Integration

### Complete System Startup

1. **Start Backend**:
   ```bash
   cd REACT+API
   python rov_backend.py
   ```

2. **Start Frontend**:
   ```bash
   cd REACT+API/rov_frontend
   npm start
   ```

3. **Start Detection System**:
   ```bash
   cd "Object detection"
   python camera_detector.py
   ```

4. **Access Interface**:
   - Open browser to `http://localhost:3000`

### Data Flow

1. **User Input** → React UI → FastAPI → ESP8266 → Motors/Servos
2. **ESP32S3** → MJPEG Stream → Detection System → Log File
3. **Log File** → FastAPI → React UI → Charts/Visualization

## 🐛 Troubleshooting

### Backend Issues

#### WebSocket Connection Failed

- Verify ESP8266 is powered and connected to WiFi
- Check ROV IP addresses in `CAR_IPS`
- Verify WebSocket port (default 81)
- Check serial monitor on ESP8266 for connection status

#### Log File Not Found

- Ensure detection system is running and creating log file
- Verify `LOG_FILE_PATH` is correct
- Check file permissions
- Ensure backend is run from correct directory

### Frontend Issues

#### Cannot Connect to Backend

- Verify backend is running on port 8000
- Check `API_URL` in `App.js`
- Check browser console for CORS errors
- Verify firewall settings

#### Cards Not Saving

- Check browser localStorage is enabled
- Clear browser cache and try again
- Check browser console for errors

#### Camera Feed Not Displaying

- Verify camera stream URL is correct
- Test stream URL directly in browser
- Check network connectivity
- Verify ESP32S3 is streaming

## 📚 Dependencies

### Backend Dependencies

- `fastapi`: Web framework
- `uvicorn`: ASGI server
- `websockets`: WebSocket support

### Frontend Dependencies

- `react`: UI framework
- `react-dom`: DOM rendering
- `@mui/material`: Material-UI components
- `@mui/icons-material`: Material icons
- `axios`: HTTP client
- `recharts`: Chart library
- `react-joystick-component`: Joystick control (if used)

## 🔐 Security Notes

### Development

- CORS is set to allow all origins (`origins = ["*"]`)
- No authentication implemented
- WebSocket connections are unencrypted

### Production Recommendations

1. **Restrict CORS**:
   ```python
   origins = ["https://yourdomain.com"]
   ```

2. **Add Authentication**: Implement JWT or session-based auth

3. **Use HTTPS/WSS**: Encrypt all communications

4. **Input Validation**: Validate all API inputs

5. **Rate Limiting**: Prevent abuse

## 🚀 Deployment

### Backend Deployment

1. **Using Uvicorn**:
   ```bash
   uvicorn rov_backend:app --host 0.0.0.0 --port 8000
   ```

2. **Using Gunicorn** (with Uvicorn workers):
   ```bash
   gunicorn rov_backend:app -w 4 -k uvicorn.workers.UvicornWorker
   ```

3. **Using Docker**:
   ```dockerfile
   FROM python:3.9
   WORKDIR /app
   COPY requirements.txt .
   RUN pip install -r requirements.txt
   COPY rov_backend.py .
   CMD ["uvicorn", "rov_backend:app", "--host", "0.0.0.0", "--port", "8000"]
   ```

### Frontend Deployment

1. **Build**:
   ```bash
   npm run build
   ```

2. **Serve with Nginx**:
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       root /path/to/build;
       index index.html;
       
       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```

3. **Serve with Node.js**:
   ```bash
   npm install -g serve
   serve -s build
   ```

## 📈 Performance

### Backend

- Handles multiple concurrent WebSocket connections
- Efficient log file reading (seeks to last position)
- Async/await for non-blocking operations

### Frontend

- Optimized React rendering with `React.memo`
- Efficient state management
- Lazy loading for large components (if implemented)

## 🔄 Future Enhancements

- [ ] User authentication and authorization
- [ ] Multi-user support
- [ ] Real-time video streaming in frontend
- [ ] Database integration for logs
- [ ] Export detection data
- [ ] Mobile app version
- [ ] Advanced analytics dashboard
- [ ] Alert/notification system

