#include <Wire.h>
#include "VL53L1X.h"
#include <AccelStepper.h>
#include <Servo.h>


// ----------Data transmission protocol ----------- //
//Sending
/* Commands (1Byte):
 * 0x00b: Data transmission
 * 0x01b: Status message transmission
 * 0x10b: Debug message transmission
 * 0x11b: Error message transmission
 */
/* Data: (10 x 4 Bytes)
 Start of message: 0xFF
 * distanceMeasurement
 * distance STD
 * ESC speed
 * stepper angle
 * stepper angular speed
 * stepper max angular speed
 * distance buffer size
 * timing budgetDATA
 * CheckSum
 End of message: 0xFE
 */


// Receiving (5 Bytes)
/* Commands (1B)
 * 0x0000b: Set ESC speed
 * 0x0001b: Set stepper angle
 * 0x0010b: Set stepper accelleration
 * 0x0011b: Set stepper max spped
 * 0x0100b: Set distancebuffer size
 * 0x0101b: Set timing budget
 * 0x0110b: Arm/Disarm system
 * 0x0111b: Reset to zero
 */
/* Data: (4B)
 * newValue
 */

// ---------- VL53L1X Sensor Setup ----------
VL53L1X sensor;

// ---------- Stepper Motor Setup ----------
#define STEPPER_STEP_PIN 4
#define STEPPER_DIR_PIN 5
AccelStepper stepper(AccelStepper::DRIVER, STEPPER_STEP_PIN, STEPPER_DIR_PIN);

const float GEAR_RATIO = 31.0 / 3.0; // Übersetzung
const float STEPS_PER_REV = 200.0 * 8;   // 1.8 Grad Schritte
const float DEGREE_PER_STEP = (360.0 / (STEPS_PER_REV * GEAR_RATIO)); // Grad pro Schritt

// ---------- ESC (BL Motor) Setup ----------
Servo esc;
const int32_t ESC_PIN = 9;           // PWM Pin für ESC
const int32_t ESC_MIN_SIGNAL = 1000; // Minimales PWM Signal in µs
const int32_t ESC_MAX_SIGNAL = 2000; // Maximales PWM Signal in µs
int32_t pwmSignal = ESC_MIN_SIGNAL;  // Start-PWM-Signal für ESC

// ---------- Einstellbare Parameter ----------
float targetAngle = 0.0;  // Zielwinkel für Stepper in Grad

// ---------- Sensor einstellungen ------------
#define XSHUT_PIN 3
int32_t numLaserMeasurements = 3; // Anzahl der Laser Messungen

// Time allowed for a distance measurement in us 
// Minimum 33000 us
int32_t timingBudget = 40000;

// ---------- Systemstatus ----------
bool systemArmed = false;

// ---------- Sensorwerte ----------
float currentDistance = 0.0;
float distanceStdDev = 0.0;

// ---------- Stepperwerte ----------
float currentStepperAngle = 0.0;
float previousStepperAngle = 0.0;
unsigned long previousStepperTime = 0;
float stepperAngularSpeed = 0.0; // in degrees per second
float stepperMaxSpeed;

unsigned long lastDataSendTime = 0;
unsigned long lastLaserMeasureTime = 0;
const unsigned long dataSendInterval = 100;  // 100ms for sending data
const unsigned long laserMeasureInterval = 100;  // 50ms for laser measurement

// --------- Distance Buffer --------
// Collects distance measurements non blockingly whenever possible and 
// Calculate mean / std every 100ms from values in buffer
int16_t buffer[10] = {0}; 
int8_t i = 0;              
bool bufferFull = false;   

int32_t distanceBufferSize = 1;

void setup() {
  Serial.begin(115200);
  while (!Serial); 

  Wire.begin();
  Wire.setClock(400000);

  sensor.setTimeout(500);
  if (!sensor.init())
  {
   sendDebugMessage("Failed to detect and initialize sensor!");
    while (1);
  }


  initSensor();

  // ESC initialisieren
  esc.attach(ESC_PIN, ESC_MIN_SIGNAL, ESC_MAX_SIGNAL);
  esc.writeMicroseconds(ESC_MIN_SIGNAL);

  // Stepper initialisieren
  stepper.setMaxSpeed(4000);
  stepperMaxSpeed = 4000;

  stepper.setAcceleration(2000);
  stepper.setCurrentPosition(0); 
  previousStepperTime = millis();

  sendDebugMessage("Setup abgeschlossen");
}

void initSensor() {
   // Configure sensor to have a smal ROI very centered
  sensor.setDistanceMode(VL53L1X::Medium);
  sensor.setROISize(4,4);
  sensor.setROICenter(199);
  sensor.setMeasurementTimingBudget(timingBudget);
  sensor.startContinuous(100);
}

void loop() {
  // Run these processes non blocking as often as possible
  stepper.run();
  updateStepperStatus();
  processSerialCommands();
  measureDistance();
  unsigned long currentTime = millis();



  // Perform laser measurement every 100ms
  if (currentTime - lastLaserMeasureTime >= laserMeasureInterval) {
    lastLaserMeasureTime = currentTime;
    calculateDistanceData();
  }

  // Send data every 100ms
  if (currentTime - lastDataSendTime >= dataSendInterval) {
      lastDataSendTime = currentTime;
      sendDataOverSerial();
  }
}

void processSerialCommands() {
  // Check if data is available on the Serial and process it as soon as possible
  uint8_t inputBuffer[5];
  while (Serial.available() >= 5) {  
    Serial.readBytes(inputBuffer, 5);
    uint8_t command = inputBuffer[0];
    uint8_t* dataPointer = &inputBuffer[1]; 
    processSerialInput(command, dataPointer);  
  }
}


void processSerialInput(uint8_t command, uint8_t* value) {
  uint32_t intValue;
  float floatValue;

  switch(command) {
    case 0x00:
      memcpy(&intValue, value, sizeof(uint32_t)); 
      sendDebugMessage("Setting pwm " + String(intValue)); // Treat value as an int
      if (intValue >= ESC_MIN_SIGNAL && intValue <= ESC_MAX_SIGNAL) {
        pwmSignal = intValue;
      }
      break;

    case 0x01:
      memcpy(&floatValue, value, sizeof(float));  // Treat value as a float
      setStepperAngle(floatValue);
      break;

    case 0x02:
      memcpy(&floatValue, value, sizeof(float));  // Treat value as a float
      stepper.setAcceleration(floatValue);
      break;

    case 0x03:
      memcpy(&floatValue, value, sizeof(float));  // Treat value as a float
      stepper.setMaxSpeed(floatValue);
      stepperMaxSpeed = floatValue;
      break;

    case 0x04:
      memcpy(&intValue, value, sizeof(uint32_t));  // Treat value as an int
      if (intValue < 1) intValue = 1;
      if (intValue > 10) intValue = 10;
      distanceBufferSize = intValue;
      break;

    case 0x05:
      memcpy(&floatValue, value, sizeof(float));  // Treat value as a float
      if (floatValue < 33000) floatValue = 33000;
      sensor.stopContinuous();
      sensor.startContinuous(floatValue);
      break;

    case 0x06:
      memcpy(&intValue, value, sizeof(uint32_t));  // Treat value as an int (for boolean)
      systemArmed = !!intValue;
      break;

    case 0x07:
      stepper.setCurrentPosition(0);
      currentStepperAngle = 0.0;
      previousStepperAngle = 0.0;
      break;

    default:
      sendErrorMessage("Ungültiger befehl: " + String(command));
      break;
  }
}


void sendDataOverSerial() {
  uint8_t buffer[sizeof(currentDistance) + sizeof(distanceStdDev) + sizeof(pwmSignal) +
                   sizeof(currentStepperAngle) + sizeof(stepperAngularSpeed) +
                   sizeof(stepperMaxSpeed) + sizeof(numLaserMeasurements) + sizeof(timingBudget)];
    
    // Copy data into buffer
    size_t offset = 0;
    memcpy(&buffer[offset], (uint8_t*)&currentDistance, sizeof(currentDistance));
    offset += sizeof(currentDistance);
    
    memcpy(&buffer[offset], (uint8_t*)&distanceStdDev, sizeof(distanceStdDev));
    offset += sizeof(distanceStdDev);
    
    memcpy(&buffer[offset], (uint8_t*)&pwmSignal, sizeof(pwmSignal));
    offset += sizeof(pwmSignal);
    
    memcpy(&buffer[offset], (uint8_t*)&currentStepperAngle, sizeof(currentStepperAngle));
    offset += sizeof(currentStepperAngle);
    
    memcpy(&buffer[offset], (uint8_t*)&stepperAngularSpeed, sizeof(stepperAngularSpeed));
    offset += sizeof(stepperAngularSpeed);
    
    memcpy(&buffer[offset], (uint8_t*)&stepperMaxSpeed, sizeof(stepperMaxSpeed));
    offset += sizeof(stepperMaxSpeed);
    
    memcpy(&buffer[offset], (uint8_t*)&distanceBufferSize, sizeof(distanceBufferSize));
    offset += sizeof(distanceBufferSize);
    
    memcpy(&buffer[offset], (uint8_t*)&timingBudget, sizeof(timingBudget));
    offset += sizeof(timingBudget);
    
    // Calculate XOR checksum
    uint8_t checksum = calculateXORChecksum(buffer, sizeof(buffer));

    // Send the start byte
    Serial.write(0xFF);
    
    // Send data command
    Serial.write(0x00);

    // Send the data
    Serial.write(buffer, sizeof(buffer));
    
    // Send the checksum (1 byte)
    Serial.write(checksum);
    
    // Send the end byte
    Serial.write(0xFE);
}

void sendDebugMessage(const String &msg) {
  sendMessage(msg, 0x2);
}
void sendErrorMessage(const String &msg) {
  sendMessage(msg, 0x3);
}
void sendMessage(const String &msg, uint8_t cmd) {
  uint8_t length = msg.length();
  Serial.write(0xFF);
  Serial.write(cmd);
  Serial.write(length);
  Serial.write(msg.c_str(), length);
  Serial.write(0xFE);
    
}

 
void measureDistance() {
    // Check if sensor data is ready and read the value
    // If we dont check before reading non-blocking we have undefined behaviour
    if (sensor.dataReady()) {
        int16_t distance = sensor.read(false);
        buffer[i] = distance;  // Add distance to the current index in the buffer
        i = (i + 1) % distanceBufferSize;      // Move to the next position, wrap around with % 10
        if (i == 0) {
            bufferFull = true; // Once the buffer wraps around, mark it full
        }
    }
}

void calculateDistanceData() {
  // Calculate the mean
    int numEntries = bufferFull ? distanceBufferSize : i;  // Use 10 if buffer is full, otherwise use the current index
    float sum = 0.0;
    for (int8_t j = 0; j < numEntries; j++) {
        sum += buffer[j];
    }
    float mean = sum / numEntries;

    // Calculate the standard deviation
    float sumSq = 0.0;
    for (int8_t j = 0; j < numEntries; j++) {
        sumSq += (buffer[j] - mean) * (buffer[j] - mean);
    }
    float stdDev = sqrt(sumSq / numEntries);  // Population standard deviation

    currentDistance = mean;
    distanceStdDev = stdDev;
}



void updateStepperStatus() {
  currentStepperAngle = stepper.currentPosition() * DEGREE_PER_STEP;
  unsigned long currentTime = millis();
  unsigned long deltaTime = currentTime - previousStepperTime;

  if (deltaTime > 0) {
    stepperAngularSpeed = (currentStepperAngle - previousStepperAngle) * 1000.0 / deltaTime; // degrees per second
    previousStepperAngle = currentStepperAngle;
    previousStepperTime = currentTime;
  }
}

void setStepperAngle(float angle) {
  if (angle >= 0 && angle <= 90) {
    long targetPosition = angle / DEGREE_PER_STEP;
    stepper.moveTo(targetPosition);
    sendDebugMessage("Stepper auf Winkel bewegt: " + String(angle));
  } else {
    sendDebugMessage("Ungültiger Winkel");
  }
}



uint8_t calculateXORChecksum(uint8_t* data, size_t length) {
    uint8_t checksum = 0;
    for (size_t i = 0; i < length; i++) {
        checksum ^= data[i];  // XOR each byte
    }
    return checksum;
}
