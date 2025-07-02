#include <ESP8266WiFi.h>
#include <WebSocketsServer.h>
#include <ArduinoJson.h>
#include <Servo.h>

const char* ssid = "ESP32-CAM";
const char* password = "123456789";

// Static IP configuration
IPAddress local_IP(192, 168, 22, 159);
IPAddress gateway(192, 168, 1, 1);
IPAddress subnet(255, 255, 255, 0);
IPAddress primaryDNS(8, 8, 8, 8);
IPAddress secondaryDNS(8, 8, 4, 4);

// Motor control pins
#define ENA 14  // Left motors PWM
#define ENB 2   // Right motors PWM
#define IN1 5   // Left motor forward
#define IN2 0   // Left motor backward
#define IN3 4   // Right motor forward
#define IN4 16  // Right motor backward

// Servo control pins
#define PAN_SERVO_PIN 12  // D6
#define TILT_SERVO_PIN 13 // D7

Servo panServo;
Servo tiltServo;

WebSocketsServer webSocket = WebSocketsServer(81);
int currentSpeed = 150;
int panAngle = 90;
int tiltAngle = 90;

void setup() {
    pinMode(ENA, OUTPUT);
    pinMode(ENB, OUTPUT);
    pinMode(IN1, OUTPUT);
    pinMode(IN2, OUTPUT);
    pinMode(IN3, OUTPUT);
    pinMode(IN4, OUTPUT);
    
    panServo.attach(PAN_SERVO_PIN);
    tiltServo.attach(TILT_SERVO_PIN);
    
    panServo.write(panAngle);
    tiltServo.write(tiltAngle);

    Serial.begin(115200);
    
    WiFi.config(local_IP, gateway, subnet, primaryDNS, secondaryDNS);
    WiFi.begin(ssid, password);
    
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    
    Serial.println("\nConnected to WiFi");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());

    webSocket.begin();
    webSocket.onEvent(webSocketEvent);

    analogWriteFreq(1000);
    analogWriteRange(255);
}

void loop() {
    webSocket.loop();
}

void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
    if (type == WStype_TEXT) {
        StaticJsonDocument<200> doc;
        deserializeJson(doc, payload);
        
        int left = doc["left"];
        int right = doc["right"];
        int pan = doc["pan"];
        int tilt = doc["tilt"];
        
        setMotors(left, right);
        setPanTilt(pan, tilt);

        // Send updated pan/tilt angles back to the client
        StaticJsonDocument<200> response;
        response["pan"] = panAngle;
        response["tilt"] = tiltAngle;
        
        String responseStr;
        serializeJson(response, responseStr);
        webSocket.sendTXT(num, responseStr);
    }
}

void setMotors(int leftSpeed, int rightSpeed) {
    digitalWrite(IN1, leftSpeed > 0 ? HIGH : LOW);
    digitalWrite(IN2, leftSpeed < 0 ? HIGH : LOW);
    analogWrite(ENA, constrain(abs(leftSpeed), 0, 255));

    digitalWrite(IN3, rightSpeed > 0 ? HIGH : LOW);
    digitalWrite(IN4, rightSpeed < 0 ? HIGH : LOW);
    analogWrite(ENB, constrain(abs(rightSpeed), 0, 255));
}

void setPanTilt(int pan, int tilt) {
    panAngle = constrain(pan, 0, 180);
    tiltAngle = constrain(tilt, 0, 180);
    
    panServo.write(panAngle);
    tiltServo.write(tiltAngle);
}
