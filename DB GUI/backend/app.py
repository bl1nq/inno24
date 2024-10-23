import struct
from random import random
from time import sleep

import eventlet

eventlet.monkey_patch()
import threading
import serial
import time
from flask import Flask
from flask_socketio import SocketIO, emit

# Serielle Kommunikation initialisieren
# For Linux / Mac
# arduino_port = '/dev/cu.usbmodem113101'
# For Windows
arduino_port = 'COM4'
baud_rate = 115200

# Globale Variablen für Sensordaten
data = {
    'distance': 0.0,
    'distance_std_dev': 0.0,
    'esc_speed': 0,
    'stepper_angle': 0.0,
    'stepper_angular_speed': 0.0,
    'stepper_max_speed': 0.0,
    'distance_buffer_size': 0,
    'timing_budget': 0,
    'system_armed': False,
    'status_message': '',
    'debug_messages': [],
}

data_grouping = [
    ['esc_speed'],
    ['stepper_angle', 'stepper_max_speed', 'stepper_angular_speed'],
    ['distance', 'distance_std_dev'],
    ['laser_measurements', 'timing_budget', 'system_armed', 'status_message', 'debug_messages'],
]
data_struct = {
    'distance': {
        'unit': 'mm',
        'type': 'number',
        'constraints': [],
        'commands': {
            'get': {'name': 'get_distance', 'parameter': {}},
        },
        'graph': {
            'type': 'line',
        },
        'autoupdate': True,
    },
    'distance_std_dev': {
        'unit': 'mm',
        'type': 'number',
        'constraints': [],
        'commands': {
            'get': {'name': 'get_distance_std_dev', 'parameter': {}},
        },
        'graph': {
            'type': 'line',
        },
        'autoupdate': True,
    },
    'esc_speed': {
        'unit': 'MHz',
        'type': 'number',
        'constraints': [0, [1060, 2000]],
        'commands': {
            'get': {'name': 'get_esc_speed', 'parameter': {}},
            'set': {'name': 'set_esc_speed',
                    'parameter': {'name': 'New ESC Speed', 'type': 'number', 'required': True}},
        },
        'graph': {
            'type': 'line',
        },
        'autoupdate': True,
    },
    'stepper_angle': {
        'unit': '°',
        'type': 'number',
        'constraints': [[0, 90]],
        'commands': {
            'get': {'name': 'get_stepper_angle', 'parameter': {}},
            'set': {'name': 'set_stepper_angle',
                    'parameter': {'name': 'New Stepper Angle', 'type': 'number', 'required': True}},
        },
        'graph': {
            'type': 'circular',
        },
        'autoupdate': True,
    },
    'stepper_angular_speed': {
        'unit': 'deg/s',
        'type': 'number',
        'constraints': [[0, 1000]],
        'commands': {
            'get': {'name': 'get_stepper_angular_speed', 'parameter': {}},
        },
        'graph': {
            'type': 'line',
        },
        'autoupdate': True,
    },
    'stepper_max_speed': {
        'unit': 'deg/s',
        'type': 'number',
        'constraints': [[0, 1000]],
        'commands': {
            'set': {'name': 'set_stepper_max_speed',
                    'parameter': {'name': 'New Stepper Max Speed', 'type': 'number', 'required': True}},
            'get': {'name': 'get_stepper_max_speed', 'parameter': {}},
        },
        'autoupdate': True,
    },
    'laser_measurements': {
        'unit': '',
        'type': 'number',
        'constraints': [],
        'commands': {
            'set': {'name': 'set_laser_measurements',
                    'parameter': {'name': 'New Laser Measurements', 'type': 'number', 'required': True}},
            'get': {'name': 'get_laser_measurements', 'parameter': {}},
        },
        'autoupdate': True,
    },
    'timing_budget': {
        'unit': 'ms',
        'type': 'number',
        'constraints': [],
        'commands': {
            'set': {'name': 'set_timing_budget',
                    'parameter': {'name': 'New Timing Budget', 'type': 'number', 'required': True}},
            'get': {'name': 'get_timing_budget', 'parameter': {}},
        },
        'autoupdate': True,
    },
    'system_armed': {
        'unit': '',
        'type': 'boolean',
        'constraints': [],
        'commands': {
            'get': {'name': 'get_system_armed', 'parameter': {}},
            'arm': {'name': 'arm_system', 'parameter': {'name': 'Arm System', 'type': 'boolean', 'required': False}},
            'disarm': {'name': 'disarm_system',
                       'parameter': {'name': 'Disarm System', 'type': 'boolean', 'required': False}},
        },
        'autoupdate': True,
    },
    'status_message': {
        'unit': '',
        'type': 'string',
        'constraints': [],
        'commands': {
            'get': {'name': 'get_status_message', 'parameter': {}},
        },
        'autoupdate': True,
    },
    'debug_messages': {
        'unit': '',
        'type': 'string[]',
        'constraints': [],
        'commands': {
            'get': {'name': 'get_debug_messages', 'parameter': {}},
        },
        'autoupdate': True,
    },
}

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
        # Read byte until start of message is received
        b = ser.read(1)
        if b != b'\xff':
            sleep(0.01)
            continue

        # Read command byte
        command = ser.read(1)
        if command == b'\x00':
            received_data = ser.read(34)
            n1, n2, n3, n4, n5, n6, n7, n8, received_checksum, end = struct.unpack('<2f1i3f2i2B', received_data)

            # Recalculate checksum
            checksum = 0
            for i in received_data[:-2]:
                checksum ^= i

            if checksum != received_checksum:
                print("Checksum error", checksum, received_checksum)
                ser.read(1)
                continue

            print(f"Received data: {n1}, {n2}, {n3}, {n4}, {n5}, {n6}, {n7}, {n8}")

            try:
                if not float(n1) == data['distance']:
                    socketio.emit('update_distance', float(n1))

                if not float(n2) == data['distance_std_dev']:
                    socketio.emit('update_distance_std_dev', float(n2))

                if not int(n3) == data['esc_speed']:
                    socketio.emit('update_esc_speed', int(n3))

                if not float(n4) == data['stepper_angle']:
                    socketio.emit('update_stepper_angle', float(n4))

                if not float(n5) == data['stepper_angular_speed']:
                    socketio.emit('update_stepper_angular_speed', float(n5))

                    if not float(n6) == data['stepper_max_speed']:
                        socketio.emit('update_stepper_max_speed', float(n6))

                if not int(n7) == data['distance_buffer_size']:
                    socketio.emit('update_distance_buffer_size', int(n7))

                if not int(n8) == data['timing_budget']:
                    socketio.emit('update_timing_budget', int(n8))

                data['distance'] = float(n1)
                data['distance_std_dev'] = float(n2)
                data['esc_speed'] = int(n3)
                data['stepper_angle'] = float(n4)
                data['stepper_angular_speed'] = float(n5)
                data['stepper_max_speed'] = float(n6)
                data['distance_buffer_size'] = int(n7)
                data['timing_budget'] = int(n8)
            except ValueError:
                print("Fehler beim Parsen der Daten.")
        else:
            length = ser.read(1)
            message = ser.read(int.from_bytes(length))

            if command == b'\x01':
                print(f"Message: {message}")
            elif command == b'\x02':
                print(f"Debug: {message}")
            elif command == b'\x03':
                print(f"Error: {message}")
            else :
                print(f"Unknown command: {command}")

            if ser.read(1) != b'\xfe':
                print("MSG End not found")
                continue
        time.sleep(0.01)


@socketio.on('connect')
def handle_connect(client):
    print("Client verbunden.", client)


@socketio.on('connect_error')
def handle_connect_error(err):
    print(f"Client connection error: {err}")


@socketio.on('get_data')
def handle_get_data():
    emit('update_data', data)


@socketio.on('get_grouping')
def handle_get_grouping():
    emit('update_grouping', data_grouping)


@socketio.on('get_structure')
def handle_get_structure():
    emit('structure', data_struct)


@socketio.on('get_distance')
def handle_get_distance():
    emit('update_distance', data['distance'])


@socketio.on('get_distance_std_dev')
def handle_get_distance_std_dev():
    emit('update_distance_std_dev', data['distance_std_dev'])


@socketio.on('set_esc_speed')
def handle_set_esc_speed(value):
    send_command(0x00, int(value))


@socketio.on('get_esc_speed')
def handle_get_esc_speed():
    emit('update_esc_speed', data['esc_speed'])


@socketio.on('set_stepper_angle')
def handle_set_stepper_angle(value):
    send_command(0x01, float(value))


@socketio.on('get_stepper_angle')
def handle_get_stepper_angle():
    emit('update_stepper_angle', data['stepper_angle'])


@socketio.on('get_stepper_angular_speed')
def handle_get_stepper_angular_speed():
    emit('update_stepper_angular_speed', data['stepper_angular_speed'])


@socketio.on('set_stepper_max_speed')
def handle_set_stepper_max_speed(value):
    send_command(0x03, float(value))


@socketio.on('get_stepper_max_speed')
def handle_get_stepper_max_speed():
    emit('update_stepper_max_speed', data['stepper_max_speed'])


@socketio.on('set_distance_buffer_size')
def handle_set_distance_buffer_size(value):
    send_command(0x04, int(value))


@socketio.on('get_distance_buffer_size')
def handle_get_distance_buffer_size():
    emit('update_laser_measurements', data['laser_measurements'])


@socketio.on('set_timing_budget')
def handle_set_timing_budget(value):
    send_command(0x05, int(value))


@socketio.on('get_timing_budget')
def handle_get_timing_budget():
    emit('update_timing_budget', data['timing_budget'])


@socketio.on('get_system_armed')
def handle_get_system_armed():
    emit('update_system_armed', data['system_armed'])


@socketio.on('arm_system')
def handle_arm_system():
    send_command(0x06, 1)


@socketio.on('disarm_system')
def handle_disarm_system():
    send_command(0x06, 0)


def send_command(command, value):
    print(f"Send command: {command} with value {value}")
    global ser
    if ser is not None:
        try:
            # If value is a float, pack it into 4 bytes (float in binary form)
            if isinstance(value, float):
                value_bytes = struct.pack('f', value)  # Pack the float as 4 bytes
            else:
                value_bytes = struct.pack('i', value)  # Pack the integer as 4 bytes

            ser.write(bytes([command]) + value_bytes)  # Send the command and value bytes
        except Exception as e:
            print(f"Fehler beim Senden des Befehls '{command}': {e}")
    else:
        print(f"Serielle Verbindung nicht initialisiert. Befehl '{command}' konnte nicht gesendet werden.")


def randomSimulateSpeed():
    global data
    while True:
        start = data['esc_speed']
        end = 1000 + random() * 1000

        for i in range(0, 100):
            data['esc_speed'] = start + (end - start) * i / 100
            socketio.emit('update_esc_speed', data['esc_speed'])
            time.sleep(0.1)

        data['esc_speed'] = end


def randomSimulateAngle():
    global data
    while True:
        start = data['stepper_angle']
        end = random() * 90

        for i in range(0, 100):
            data['stepper_angular_speed'] = -0.04 * i ** 2 + 4 * i
            socketio.emit('update_stepper_angular_speed', data['stepper_angular_speed'])

            data['stepper_angle'] = start + (end - start) * i / 100
            socketio.emit('update_stepper_angle', data['stepper_angle'])
            time.sleep(0.1)

        data['stepper_angle'] = end


def randomSimulateDistance():
    global data
    while True:
        start = data['distance']
        end = random() * 5000

        for i in range(0, 1000):
            data['distance'] = start + (end - start) * i / 1000
            socketio.emit('update_distance', data['distance'])
            time.sleep(0.001)
        data['distance'] = end


def randomSimulateDistanceSTD():
    global data
    while True:
        start = data['distance_std_dev']
        end = random() * 21 - 1

        for i in range(0, 1000):
            data['distance_std_dev'] = start + (end - start) * i / 1000
            socketio.emit('update_distance_std_dev', data['distance_std_dev'])
            time.sleep(0.01)

        data['distance_std_dev'] = end


if __name__ == '__main__':
    # Starten des seriellen Threads
    threading.Thread(target=serial_thread, daemon=True).start()
    # threading.Thread(target=randomSimulateAngle, daemon=True).start()
    # threading.Thread(target=randomSimulateSpeed, daemon=True).start()
    # threading.Thread(target=randomSimulateDistance, daemon=True).start()
    # threading.Thread(target=randomSimulateDistanceSTD, daemon=True).start()
    # Starten des Flask-Servers mit eventlet
    socketio.run(app, host='0.0.0.0', port=8888)
