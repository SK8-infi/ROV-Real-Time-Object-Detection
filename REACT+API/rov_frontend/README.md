# ROV Frontend (React)

This is a modern React app for controlling your ROV (Remotely Operated Vehicle).

## Features
- Beautiful, responsive UI (Material UI)
- Sliders for speed, pan, tilt, and duration
- Real-time pan/tilt updates
- Movement buttons (forward, backward, left, right, stop)
- Connection status indicator
- Live messages/telemetry from the car

## How to Use

1. **Install dependencies:**
   ```sh
   npm install
   ```
2. **Start the app:**
   ```sh
   npm start
   ```
   The app will open at http://localhost:3000

3. **Backend:**
   Make sure the FastAPI backend (`rov_backend.py`) is running at http://localhost:8000

## Backend API
- `POST /command` — Send a command to the car
- `WS /ws` — Receive messages/telemetry from the car

## Customization
- You can change the backend URL in `src/App.js` if needed.

--- 