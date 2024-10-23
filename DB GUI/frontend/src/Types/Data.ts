export type DataKey = keyof Data;
export type DataType = number | string | boolean | string[];

export interface Data {
    'distance': number;
    'distance_std_dev': number;
    'esc_speed': number
    'stepper_angle': number
    'stepper_angular_speed': number
    'stepper_max_speed': number
    'laser_measurements': number
    'timing_budget': number
    'system_armed': boolean,
    'status_message': string
    'debug_messages': string[]
}

export type DataPoint<T> = { y: T extends DataType ? T : DataType, x: number }
export type DataHistory<T = DataType> = DataPoint<T>[];

