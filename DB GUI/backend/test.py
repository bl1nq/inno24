import threading

import serial
from eventlet import sleep


def serial_thread():
    global data, ser
    try:
        ser = serial.Serial("COM4", 115200, timeout=1)
        print("Serielle Verbindung hergestellt.")
    except Exception as e:
        print(f"Fehler bei der seriellen Verbindung: {e}")
        return

    while True:
        if ser.in_waiting > 0:
            line = ser.readline().decode('utf-8').strip()
            print(line)

        sleep(0.1)


if __name__ == '__main__':
    # Starten des seriellen Threads
    threading.Thread(target=serial_thread, daemon=True).start()
    while True:
        sleep(1)
