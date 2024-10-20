import eventlet
eventlet.monkey_patch()
import eventlet.wsgi
import threading
import serial
import time
from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit
import pandas as pd
import os

# Serielle Kommunikation initialisieren
arduino_port = '/dev/cu.usbmodem113101'  # Ändern Sie dies auf den entsprechenden Port
baud_rate = 115200

# Globale Variablen für Sensordaten
data = {
    'distance': 0.0,
    'distance_std_dev': 0.0,
    'esc_speed': 0,
    'stepper_angle': 0.0,
    'stepper_angular_speed': 0.0,
    'system_armed': False,
    'status_message': '',
    'debug_messages': []
}

ser = None  # Globale Variable für die serielle Verbindung

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, async_mode='eventlet')

def serial_thread():
    global data, ser
    try:
        ser = serial.Serial(arduino_port, baud_rate, timeout=1)
        print("Serielle Verbindung hergestellt.")
    except Exception as e:
        print(f"Fehler bei der seriellen Verbindung: {e}")
        return

    while True:
        if ser.in_waiting > 0:
            line = ser.readline().decode('utf-8').strip()
            if line.startswith("DATA,"):
                tokens = line.split(',')
                if len(tokens) == 6:
                    try:
                        data['distance'] = float(tokens[1])
                        data['distance_std_dev'] = float(tokens[2])
                        data['esc_speed'] = int(tokens[3])
                        data['stepper_angle'] = float(tokens[4])
                        data['stepper_angular_speed'] = float(tokens[5])
                        # Sende die aktuellen Daten an die Weboberfläche
                        socketio.emit('update_data', data)
                    except ValueError:
                        print("Fehler beim Parsen der Daten.")
            elif line.startswith("DEBUG,"):
                debug_message = line[6:]
                data['debug_messages'].append(debug_message)
                socketio.emit('debug_message', {'message': debug_message})
            else:
                print(f"Unbekannte Nachricht: {line}")
        time.sleep(0.01)

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('connect')
def handle_connect():
    print("Client verbunden.")
    emit('update_data', data)

@socketio.on('set_esc_speed')
def handle_set_esc_speed(value):
    send_command(f"SET_ESC,{value}")

@socketio.on('set_stepper_angle')
def handle_set_stepper_angle(value):
    send_command(f"SET_STEPPER_ANGLE,{value}")

@socketio.on('set_laser_measurements')
def handle_set_laser_measurements(value):
    send_command(f"SET_LASER_MEASUREMENTS,{value}")

@socketio.on('set_timing_budget')
def handle_set_timing_budget(value):
    send_command(f"SET_TIMING_BUDGET,{value}")

@socketio.on('reset_stepper_zero')
def handle_reset_stepper_zero():
    send_command("RESET_STEPPER_ZERO")

@socketio.on('set_stepper_max_speed')
def handle_set_stepper_max_speed(value):
    send_command(f"SET_STEPPER_MAX_SPEED,{value}")

@socketio.on('set_stepper_accel')
def handle_set_stepper_accel(value):
    send_command(f"SET_STEPPER_ACCEL,{value}")

@socketio.on('arm_system')
def handle_arm_system():
    data['system_armed'] = True
    send_command("ARM")
    emit('system_status', {'armed': True})

@socketio.on('disarm_system')
def handle_disarm_system():
    data['system_armed'] = False
    send_command("DISARM")
    emit('system_status', {'armed': False})

@socketio.on('save_data')
def handle_save_data(payload):
    filename = payload.get('filename', 'data.csv')
    actual_distance = payload.get('actual_distance', 0.0)
    # Daten speichern
    df = pd.DataFrame([{
        'distance': data['distance'],
        'distance_std_dev': data['distance_std_dev'],
        'esc_speed': data['esc_speed'],
        'stepper_angle': data['stepper_angle'],
        'stepper_angular_speed': data['stepper_angular_speed'],
        'actual_distance': actual_distance
    }])
    try:
        df.to_csv(filename, mode='a', header=not pd.io.common.file_exists(filename), index=False)
        emit('debug_message', {'message': f"Daten gespeichert in {filename}"})
    except Exception as e:
        emit('debug_message', {'message': f"Fehler beim Speichern der Daten: {e}"})

def send_command(command):
    global ser
    if ser is not None:
        try:
            ser.write((command + '\n').encode())
        except Exception as e:
            print(f"Fehler beim Senden des Befehls '{command}': {e}")
    else:
        print(f"Serielle Verbindung nicht initialisiert. Befehl '{command}' konnte nicht gesendet werden.")


if __name__ == '__main__':
    # Starten des seriellen Threads
    threading.Thread(target=serial_thread, daemon=True).start()
    # Starten des Flask-Servers mit eventlet
    socketio.run(app, host='0.0.0.0', port=8888)
