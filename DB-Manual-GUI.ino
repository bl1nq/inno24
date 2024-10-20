#include <Wire.h>
#include "Adafruit_VL53L1X.h"
#include <AccelStepper.h>
#include <Servo.h>

// ---------- VL53L1X Sensor Setup ----------
#define IRQ_PIN 2
#define XSHUT_PIN 3
Adafruit_VL53L1X vl53 = Adafruit_VL53L1X(XSHUT_PIN, IRQ_PIN);

// ---------- Stepper Motor Setup ----------
#define STEPPER_STEP_PIN 4
#define STEPPER_DIR_PIN 5
AccelStepper stepper(AccelStepper::DRIVER, STEPPER_STEP_PIN, STEPPER_DIR_PIN);

const float GEAR_RATIO = 31.0 / 3.0; // Übersetzung
const float STEPS_PER_REV = 200.0;   // 1.8 Grad Schritte
const float DEGREE_PER_STEP = (360.0 / (STEPS_PER_REV * GEAR_RATIO)); // Grad pro Schritt

// ---------- ESC (BL Motor) Setup ----------
Servo esc;
const int ESC_PIN = 9;           // PWM Pin für ESC
const int ESC_MIN_SIGNAL = 1000; // Minimales PWM Signal in µs
const int ESC_MAX_SIGNAL = 2000; // Maximales PWM Signal in µs
int pwmSignal = ESC_MIN_SIGNAL;  // Start-PWM-Signal für ESC

// ---------- Einstellbare Parameter ----------
float targetAngle = 0.0;  // Zielwinkel für Stepper in Grad
int numLaserMeasurements = 3; // Anzahl der Laser Messungen
int timingBudget = 50;        // Timing Budget in ms

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

void setup() {
  Serial.begin(115200);
  while (!Serial); // Warten, bis die serielle Verbindung hergestellt ist

  // Sensor initialisieren
  Wire.begin();
  if (!vl53.begin(0x29, &Wire)) {
    Serial.print(F("DEBUG,Fehler bei der Initialisierung des VL53L1X Sensors: "));
    Serial.println(vl53.vl_status);
    while (1) delay(10);
  }
  vl53.startRanging();
  vl53.setTimingBudget(timingBudget); // Timing-Budget

  // ESC initialisieren
  esc.attach(ESC_PIN, ESC_MIN_SIGNAL, ESC_MAX_SIGNAL);
  esc.writeMicroseconds(ESC_MIN_SIGNAL); // Motor stoppen

  // Stepper initialisieren
  stepper.setMaxSpeed(1000);
  stepper.setAcceleration(500);
  stepper.setCurrentPosition(0); // Startwinkel auf Null setzen
  previousStepperTime = millis();

  Serial.println("DEBUG,Setup abgeschlossen.");
}

void loop() {
  // ---------- Distanzmessung ----------
  measureDistance();

  // ---------- Stepper Winkel und Geschwindigkeit aktualisieren ----------
  updateStepperStatus();

  // ---------- Daten über serielle Schnittstelle senden ----------
  sendDataOverSerial();

  // ---------- Serielle Eingabe verarbeiten ----------
  if (Serial.available() > 0) {
    String input = Serial.readStringUntil('\n');
    input.trim();
    if (input.length() > 0) {
      processSerialInput(input);
    }
  }

  // ESC PWM Signal setzen, nur wenn systemArmed ist
  if (systemArmed) {
    esc.writeMicroseconds(pwmSignal);
  } else {
    esc.writeMicroseconds(ESC_MIN_SIGNAL); // ESC bekommt kein PWM Signal über 1000us
  }

  // Kleine Pause, um die CPU zu entlasten
  delay(10);
}

void measureDistance() {
  static float distanceReadings[10];
  static int index = 0;
  static bool bufferFull = false;

  float totalDistance = 0.0;
  float meanDistance = 0.0;
  float variance = 0.0;

  int validReadings = 0;

  for (int i = 0; i < numLaserMeasurements; i++) {
    int16_t distance;

    if (vl53.dataReady()) {
      distance = vl53.distance();
      if (distance == -1) {
        // Fehler beim Lesen der Distanz
        Serial.print(F("DEBUG,Fehler beim Lesen der Distanz: "));
        Serial.println(vl53.vl_status);
      } else {
        totalDistance += distance;
        validReadings++;
        // Messung in Puffer speichern
        distanceReadings[index] = distance;
        index = (index + 1) % 10;
        if (index == 0) bufferFull = true;
      }
      vl53.clearInterrupt();
    } else {
      Serial.println("DEBUG,Sensor-Daten nicht bereit.");
    }
    delay(10); // Kurze Pause zwischen den Messungen
  }

  if (validReadings > 0) {
    meanDistance = totalDistance / validReadings;
    currentDistance = meanDistance;

    // Standardabweichung berechnen, wenn genügend Daten vorhanden sind
    if (bufferFull) {
      float sum = 0.0;
      for (int i = 0; i < 10; i++) {
        sum += distanceReadings[i];
      }
      float mean = sum / 10;

      float sumSq = 0.0;
      for (int i = 0; i < 10; i++) {
        sumSq += (distanceReadings[i] - mean) * (distanceReadings[i] - mean);
      }
      distanceStdDev = sqrt(sumSq / 9); // Stichproben-Standardabweichung
    } else {
      distanceStdDev = 0.0;
    }
  } else {
    Serial.println("DEBUG,Keine gültigen Distanzmessungen erhalten.");
    currentDistance = -1; // Fehlerwert
  }
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

void sendDataOverSerial() {
  Serial.print("DATA,");
  Serial.print(currentDistance); // Aktuelle Distanz
  Serial.print(",");
  Serial.print(distanceStdDev); // Standardabweichung
  Serial.print(",");
  Serial.print(pwmSignal); // ESC PWM Signal
  Serial.print(",");
  Serial.print(currentStepperAngle); // Aktueller Winkel
  Serial.print(",");
  Serial.println(stepperAngularSpeed); // Winkelgeschwindigkeit
}

void processSerialInput(String input) {
  // Verarbeite Eingaben im Format: <COMMAND>,<VALUE>
  if (input.startsWith("SET_ESC,")) {
    int value = input.substring(8).toInt();
    if (value >= ESC_MIN_SIGNAL && value <= ESC_MAX_SIGNAL) {
      pwmSignal = value;
      Serial.println("DEBUG,ESC Geschwindigkeit gesetzt auf " + String(pwmSignal));
    } else {
      Serial.println("DEBUG,Ungültiger ESC Wert.");
    }
  } else if (input.startsWith("SET_STEPPER_ANGLE,")) {
    float angle = input.substring(18).toFloat();
    setStepperAngle(angle);
  } else if (input.startsWith("SET_LASER_MEASUREMENTS,")) {
    int value = input.substring(22).toInt();
    if (value > 0) {
      numLaserMeasurements = value;
      Serial.println("DEBUG,Anzahl Laser Messungen gesetzt auf " + String(numLaserMeasurements));
    }
  } else if (input.startsWith("SET_TIMING_BUDGET,")) {
    int value = input.substring(17).toInt();
    vl53.setTimingBudget(value);
    Serial.println("DEBUG,Timing Budget gesetzt auf " + String(value) + " ms");
  } else if (input.startsWith("RESET_STEPPER_ZERO")) {
    stepper.setCurrentPosition(0);
    currentStepperAngle = 0.0;
    previousStepperAngle = 0.0;
    Serial.println("DEBUG,Stepper Nullpunkt zurückgesetzt.");
  } else if (input.startsWith("SET_STEPPER_MAX_SPEED,")) {
    float value = input.substring(21).toFloat();
    stepper.setMaxSpeed(value);
    Serial.println("DEBUG,Stepper Max Geschwindigkeit gesetzt auf " + String(value));
  } else if (input.startsWith("SET_STEPPER_ACCEL,")) {
    float value = input.substring(17).toFloat();
    stepper.setAcceleration(value);
    Serial.println("DEBUG,Stepper Beschleunigung gesetzt auf " + String(value));
  } else if (input == "ARM") {
    systemArmed = true;
    Serial.println("DEBUG,System ARMED.");
  } else if (input == "DISARM") {
    systemArmed = false;
    Serial.println("DEBUG,System DISARMED.");
  } else {
    Serial.println("DEBUG,Ungültiger Befehl: " + input);
  }
}

void setStepperAngle(float angle) {
  if (angle >= 0 && angle <= 90) {
    long targetPosition = angle / DEGREE_PER_STEP;
    stepper.moveTo(targetPosition);
    stepper.runToPosition();
    Serial.println("DEBUG,Stepper auf Winkel bewegt: " + String(angle));
  } else {
    Serial.println("DEBUG,Ungültiger Winkel.");
  }
}
