export interface Data {
    'distance': number;
    'distance_std_dev': number;
    'esc_speed': number
    'stepper_angle': number
    'stepper_angular_speed': number
    'system_armed': boolean,
    'status_message': string
    'debug_messages': string[]
}
export type DataGroup = (keyof Data)[];

export type DataHistory = {
    [str in keyof Data]: [number, number][];
}

export type DataGrouping = DataGroup[];