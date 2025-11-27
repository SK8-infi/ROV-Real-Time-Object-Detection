# Arduino Firmware Documentation

This directory contains the embedded firmware for the ROV system, including motor/servo control (ESP8266) and camera streaming (ESP32S3).

## 📁 Directory Structure

```
ARDUINO/
├── ESP8266/                    # Motor and servo controller
│   └── sketch_apr2a/
│       └── sketch_apr2a.ino    # Main control firmware
│
└── XIAO ESP32S3/               # Camera module
    └── CameraWebServer/
        ├── CameraWebServer.ino # Main camera server
        ├── app_httpd.cpp        # HTTP server implementation
        ├── camera_pins.h        # Camera pin definitions
        ├── camera_index.h       # Web interface HTML
        └── partitions.csv       # ESP32 partition table
```

## 🔌 ESP8266 Motor Controller

### Overview

The ESP8266 firmware controls the ROV's motors and pan/tilt servos via WebSocket commands. It connects to the ESP32-CAM WiFi network and listens for control commands.

### Hardware Connections

#### Motor Control Pins
- **ENA (Pin 14)**: Left motors PWM control
- **ENB (Pin 2)**: Right motors PWM control
- **IN1 (Pin 5)**: Left motor forward direction
- **IN2 (Pin 0)**: Left motor backward direction
- **IN3 (Pin 4)**: Right motor forward direction
- **IN4 (Pin 16)**: Right motor backward direction

#### Servo Control Pins
- **PAN_SERVO_PIN (Pin 12/D6)**: Pan servo control
- **TILT_SERVO_PIN (Pin 13/D7)**: Tilt servo control

### Configuration

Edit the following in `sketch_apr2a.ino`:

```cpp
// WiFi Configuration
const char* ssid = "ESP32-CAM";        // WiFi network name
const char* password = "123456789";    // WiFi password

// Static IP Configuration
IPAddress local_IP(192, 168, 22, 159);  // ESP8266 IP address
IPAddress gateway(192, 168, 1, 1);
IPAddress subnet(255, 255, 255, 0);

// WebSocket Port
WebSocketsServer webSocket = WebSocketsServer(81);
```

### Message Protocol

The ESP8266 receives JSON commands via WebSocket:

```json
{
  "left": 150,    // Left motor speed (-255 to 255)
  "right": -150,  // Right motor speed (-255 to 255)
  "pan": 90,      // Pan angle (0-180 degrees)
  "tilt": 90      // Tilt angle (0-180 degrees)
}
```

**Response**:
```json
{
  "pan": 90,      // Current pan angle
  "tilt": 90      // Current tilt angle
}
```

### Motor Control Logic

- **Positive speed**: Motor rotates forward
- **Negative speed**: Motor rotates backward
- **Speed 0**: Motor stops
- **Right motor**: Typically inverted (multiplied by -1) for differential drive

### Installation

1. **Install Arduino IDE** (1.8+ or 2.0+)

2. **Install ESP8266 Board Support**:
   - Go to File → Preferences
   - Add to Additional Board Manager URLs:
     ```
     http://arduino.esp8266.com/stable/package_esp8266com_index.json
     ```
   - Go to Tools → Board → Boards Manager
   - Search for "ESP8266" and install

3. **Install Required Libraries**:
   - **WebSocketsServer**: `Tools → Manage Libraries → Search "WebSockets"`
   - **ArduinoJson**: `Tools → Manage Libraries → Search "ArduinoJson"`
   - **Servo**: Usually included with Arduino IDE

4. **Select Board**:
   - Tools → Board → ESP8266 Boards → NodeMCU 1.0 (ESP-12E Module)
   - Or select your specific ESP8266 board

5. **Configure Settings**:
   - Upload Speed: 115200
   - CPU Frequency: 80 MHz
   - Flash Size: 4MB (FS:2MB OTA:~1019KB)
   - Port: Select your COM port

6. **Upload Firmware**:
   - Open `ESP8266/sketch_apr2a/sketch_apr2a.ino`
   - Click Upload
   - Monitor serial output at 115200 baud

### Serial Monitor Output

Expected output after successful connection:

```
Connected to WiFi
IP address: 192.168.22.159
```

### Troubleshooting

#### WiFi Connection Issues
- Verify SSID and password are correct
- Check ESP8266 is within range of ESP32-CAM network
- Verify static IP doesn't conflict with other devices
- Check serial monitor for connection errors

#### Motor Not Responding
- Verify motor driver connections
- Check power supply voltage (7-12V for motors)
- Verify PWM pins are correctly connected
- Test motors directly with power supply

#### Servo Not Moving
- Verify servo power supply (5V, sufficient current)
- Check servo signal wire connections
- Verify servo library is installed
- Test servos with example code

## 📷 ESP32S3 Camera Module

### Overview

The ESP32S3 firmware provides a web server that streams camera video via MJPEG. It creates a WiFi Access Point that other devices (ESP8266, control station) connect to.

### Hardware Requirements

- **ESP32S3 Development Board** (XIAO ESP32S3 or similar)
- **Camera Module**: OV2640, OV3660, or OV5640
- **PSRAM**: Required for optimal performance (recommended)

### Camera Pin Configuration

The pin configuration is defined in `camera_pins.h`. For XIAO ESP32S3:

- Camera pins are pre-configured for the XIAO ESP32S3 camera module
- Verify your camera module matches the pin definitions

### Configuration

Edit `CameraWebServer.ino`:

```cpp
// WiFi Access Point Configuration
const char* ssid = "ESP32-CAM";        // AP SSID
const char* password = "123456789";     // AP Password

// Camera Settings
config.frame_size = FRAMESIZE_VGA;     // VGA (640x480)
config.jpeg_quality = 4;               // Quality (0-63, lower = better)
config.fb_count = 1;                   // Frame buffer count
```

### Web Server Endpoints

The camera server provides several HTTP endpoints:

- **`/`**: Web interface for camera control
- **`/stream`**: MJPEG video stream (used by detection system)
- **`/capture`**: Single JPEG image capture
- **`/status`**: Camera status JSON
- **`/control`**: Camera parameter control

### Stream URL

The video stream is accessible at:
```
http://192.168.4.1:81/stream
```

Or use the default port 80:
```
http://192.168.4.1/stream
```

### Installation

1. **Install ESP32 Board Support**:
   - Go to File → Preferences
   - Add to Additional Board Manager URLs:
     ```
     https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
     ```
   - Go to Tools → Board → Boards Manager
   - Search for "ESP32" and install

2. **Install Required Libraries**:
   - Most libraries are included with ESP32 board support
   - Camera libraries are part of ESP32 Arduino core

3. **Select Board**:
   - Tools → Board → ESP32 Arduino → XIAO ESP32S3
   - Or select your specific ESP32S3 board

4. **Configure Settings**:
   - Upload Speed: 921600
   - CPU Frequency: 240 MHz
   - Flash Size: 4MB (or as per your board)
   - Partition Scheme: Default (or use `partitions.csv`)
   - Port: Select your COM port

5. **Upload Firmware**:
   - Open `XIAO ESP32S3/CameraWebServer/CameraWebServer.ino`
   - Click Upload
   - Monitor serial output at 115200 baud

### Serial Monitor Output

Expected output after successful startup:

```
Access Point 'ESP32-CAM' created!
IP address for streaming: 192.168.4.1
Camera Ready! Connect to the AP and visit the IP above
```

### Camera Settings

You can adjust camera settings via the web interface or HTTP GET requests:

```
http://192.168.4.1/control?var=framesize&val=8
http://192.168.4.1/control?var=quality&val=10
http://192.168.4.1/control?var=brightness&val=0
```

**Available Parameters**:
- `framesize`: 0-10 (0=QQVGA, 5=SVGA, 10=UXGA)
- `quality`: 0-63 (lower = better quality)
- `brightness`: -2 to 2
- `contrast`: -2 to 2
- `saturation`: -2 to 2

### Troubleshooting

#### Camera Not Initializing
- Verify camera module is correctly connected
- Check camera module compatibility (OV2640/OV3660/OV5640)
- Verify PSRAM is available and enabled
- Check serial monitor for initialization errors

#### WiFi AP Not Creating
- Verify ESP32S3 has sufficient power
- Check antenna connection (if external)
- Verify WiFi power settings in code
- Reset and re-upload firmware

#### Stream Not Accessible
- Verify device is connected to ESP32-CAM network
- Check IP address matches configuration
- Verify port number (default 80 or 81)
- Check firewall settings on control station

#### Poor Stream Quality
- Reduce frame size (lower `framesize` value)
- Increase JPEG quality (lower `quality` value)
- Reduce frame rate in detection system
- Check network bandwidth

### Performance Optimization

1. **Enable PSRAM**: Ensure PSRAM is enabled in board settings
2. **Optimize Frame Size**: Use VGA (640x480) for good balance
3. **Adjust Quality**: Lower quality = faster streaming
4. **WiFi Power**: Maximum power is set in code (19.5 dBm)

## 🔧 Advanced Configuration

### Multiple ROV Support

To support multiple ROVs, configure different IP addresses:

**ROV 1 (ESP8266)**:
```cpp
IPAddress local_IP(192, 168, 4, 2);
```

**ROV 2 (ESP8266)**:
```cpp
IPAddress local_IP(192, 168, 4, 3);
```

Update the backend `CAR_IPS` list accordingly.

### Custom Motor Driver

If using a different motor driver, modify the `setMotors()` function:

```cpp
void setMotors(int leftSpeed, int rightSpeed) {
    // Your motor driver logic here
    // Example for L298N:
    digitalWrite(IN1, leftSpeed > 0 ? HIGH : LOW);
    digitalWrite(IN2, leftSpeed < 0 ? HIGH : LOW);
    analogWrite(ENA, abs(leftSpeed));
    // ... similar for right motor
}
```

### Custom Servo Range

Modify servo angle constraints:

```cpp
void setPanTilt(int pan, int tilt) {
    panAngle = constrain(pan, 0, 180);    // Adjust range as needed
    tiltAngle = constrain(tilt, 0, 180);
    panServo.write(panAngle);
    tiltServo.write(tiltAngle);
}
```

## 📚 Additional Resources

- [ESP8266 Arduino Core Documentation](https://arduino-esp8266.readthedocs.io/)
- [ESP32 Arduino Core Documentation](https://docs.espressif.com/projects/arduino-esp32/)
- [WebSocketsServer Library](https://github.com/Links2004/arduinoWebSockets)
- [ArduinoJson Documentation](https://arduinojson.org/)

## ⚠️ Safety Notes

- **Power Supply**: Ensure adequate power supply for motors (7-12V, sufficient current)
- **Voltage Levels**: ESP8266/ESP32 operate at 3.3V, use level shifters if interfacing with 5V devices
- **Current Limits**: Check motor driver current ratings
- **Heat Management**: Monitor temperature during extended operation
- **Isolation**: Consider electrical isolation for safety-critical applications

