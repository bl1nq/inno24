from random import random

import eventlet

eventlet.monkey_patch()
import threading
import serial
import time
from flask import Flask
from flask_socketio import SocketIO, emit
import pandas as pd

# Serielle Kommunikation initialisieren
# For Linux / Mac
# arduino_port = '/dev/cu.usbmodem113101'
# For Windows
arduino_port = 'COM3'
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
    'debug_messages': [],
}

data_grouping = [
    ['esc_speed'],
    ['stepper_angle', 'stepper_angular_speed'],
    ['distance', 'distance_std_dev'],
    ['system_armed','status_message', 'debug_messages'],
]

commands = [
    {"name": 'set_esc_speed', "for": 'esc_speed',
     "parameter": {"name": "New ESC Speed", "type": "number", "required": True, "min": 1060, "max": 2000}},
    {"name": 'set_stepper_angle', "for": 'stepper_angle',
     "parameter": {"name": "New Stepper Angle", "type": "number", "required": True, "min": 0, "max": 360}},
    {"name": 'set_stepper_angular_speed', "for": 'stepper_angular_speed',
     "parameter": {"name": "New Stepper Angular Speed", "type": "number", "required": True, "min": 0, "max": 100}},
    {"name": 'arm_system', "for": 'system_armed',
     "parameter": {"name": "Arm System", "type": "boolean", "required": False}},
    {"name": 'disarm_system', "for": 'system_armed',
     "parameter": {"name": "Disarm System", "type": "boolean", "required": False}},
    {"name": 'save_data', "for": 'data',
     "parameter": {"name": "Filename", "type": "string", "required": True}},
    {"name": 'get_distance', "for": 'distance', "parameter": {}},
]

ser = None  # Globale Variable für die serielle Verbindung

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'

socketio = SocketIO(app, async_mode='eventlet', cors_allowed_origins="*")


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
                        newData = {'distance': float(tokens[1]), 'distance_std_dev': float(tokens[2]),
                                   'esc_speed': int(tokens[3]), 'stepper_angle': float(tokens[4]),
                                   'stepper_angular_speed': float(tokens[5])}
                        # Sende die aktuellen Daten an die Weboberfläche
                        # If any data changed, emit the update_data event
                        if newData != data:
                            data = newData
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


@socketio.on('connect')
def handle_connect():
    print("Client verbunden.")

@socketio.on('connect_error')
def handle_connect_error(err):
    print(f"Client connection error: {err}")


@socketio.on('get_data')
def handle_get_data():
    emit('update_data', [data, data_grouping])


@socketio.on('get_commands')
def handle_get_commands():
    emit('commands', commands)


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
def handle_arm_system(value):
    data['system_armed'] = True
    send_command("ARM")
    emit('system_status', {'armed': True})


@socketio.on('disarm_system')
def handle_disarm_system(value):
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
    print(f"Send command: {command}")
    global ser
    if ser is not None:
        try:
            ser.write((command + '\n').encode())
        except Exception as e:
            print(f"Fehler beim Senden des Befehls '{command}': {e}")
    else:
        print(f"Serielle Verbindung nicht initialisiert. Befehl '{command}' konnte nicht gesendet werden.")

def value_thread():
    while True:
        data = {
            'distance': random() * 100,
            'distance_std_dev':random() * 10,
            'esc_speed': random() * 1000 + 1000,
            'stepper_angle': random() * 90,
            'stepper_angular_speed': random() * 100,
            'system_armed': True,
            'status_message': '',
            'debug_messages': [],
        }

        socketio.emit('update_data', [data, data_grouping])
        time.sleep(0.5)

if __name__ == '__main__':
    # Starten des seriellen Threads
    threading.Thread(target=serial_thread, daemon=True).start()
    threading.Thread(target=value_thread, daemon=True).start()
    # Starten des Flask-Servers mit eventlet
    socketio.run(app, host='127.0.0.1', port=8888)
