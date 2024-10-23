import React from "react";
import {Structure} from "../Types/Board";
import {useBoard} from "../Context/BoardContext";
import {InfoCard} from "./InfoCard";

export function Main() {
    const boardCtx = useBoard();


    const data_struct: Structure = {
        'distance': {
            'unit': 'mm',
            'type': 'number',
            'constraints': [],
            'commands': {
                'get': {'name': 'get_distance', type: "get",},
            },
            'graph': {
                'type': 'line',
                min: 0,
                max: 5000,
            },
            'heightScale': 0.4,
            'autoUpdate': true,
        },
        'distance_std_dev': {
            'unit': 'mm',
            'type': 'number',
            'constraints': [],
            'commands': {
                'get': {'name': 'get_distance_std_dev', type: "get",},
            },
            'graph': {
                'type': 'line',
                min: -1,
                max: 20,
            },
            heightScale: 0.4,
            'autoUpdate': true,
        },
        'esc_speed': {
            'unit': 'MHz',
            'type': 'number',
            'constraints': [0, [1060, 2000]],
            'commands': {
                'get': {'name': 'get_esc_speed', type: "get",},
                'set': {
                    'name': 'set_esc_speed', type: "set",
                    'parameter': {'name': 'New ESC Speed', 'type': 'number', 'required': true}
                },
            },
            'graph': {
                'type': 'line',
                min: 0,
                max: 2000,
            },
            heightScale: 0.6,
            'autoUpdate': true,
        },
        'stepper_angle': {
            'unit': '°',
            'type': 'number',
            'constraints': [[0, 90]],
            'commands': {
                'get': {'name': 'get_stepper_angle', type: "get"},
                'set': {
                    'name': 'set_stepper_angle',
                    type: "set",
                    'parameter': {'name': 'New Stepper Angle', 'type': 'number', 'required': true}
                },
            },
            'graph': {
                'type': 'circular',
                min: 0,
                max: 90,
            },
            heightScale: 0.8,
            'autoUpdate': true,
        },
        'stepper_angular_speed': {
            'unit': 'deg/s',
            'type': 'number',
            'constraints': [[0, 1000]],
            'commands': {
                'get': {'name': 'get_stepper_angular_speed', type: "get"},
            },
            'graph': {
                'type': 'line',
                min: 0,
                max: 100
            },
            heightScale: 0.5,
            'autoUpdate': true,
        },
        'stepper_max_speed': {
            'unit': 'deg/s',
            'type': 'number',
            'constraints': [[0, 1000]],
            'commands': {
                'set': {
                    'name': 'set_stepper_max_speed', type: "set",
                    'parameter': {'name': 'New Stepper Max Speed', 'type': 'number', 'required': true}
                },
                'get': {'name': 'get_stepper_max_speed', type: "get",},
            },
            'autoUpdate': true,
        },
        'laser_measurements': {
            'unit': '',
            'type': 'number',
            'constraints': [],
            'commands': {
                'set': {
                    'name': 'set_laser_measurements', type: "set",
                    'parameter': {'name': 'New Laser Measurements', 'type': 'number', 'required': true}
                },
                'get': {'name': 'get_laser_measurements', type: "get",},
            },
            'autoUpdate': true,
        },
        'timing_budget': {
            'unit': 'ms',
            'type': 'number',
            'constraints': [],
            'commands': {
                'set': {
                    'name': 'set_timing_budget', type: "set",
                    'parameter': {'name': 'New Timing Budget', 'type': 'number', 'required': true}
                },
                'get': {'name': 'get_timing_budget', type: "get",},
            },
            'autoUpdate': true,
        },
        'system_armed': {
            'unit': '',
            'type': 'boolean',
            'constraints': [],
            'commands': {
                'get': {'name': 'get_system_armed', type: "get",},
                'arm': {
                    'name': 'arm_system',
                    type: "set",
                },
                'disarm': {
                    'name': 'disarm_system',
                    type: "set",
                },
            },
            'autoUpdate': true,
        },
        'status_message': {
            'unit': '',
            'type': 'string',
            'constraints': [],
            'commands': {
                'get': {'name': 'get_status_message', type: "get",},
            },
            'autoUpdate': true,
        },
        'debug_messages': {
            'unit': '',
            'type': 'string[]',
            'constraints': [],
            'commands': {
                'get': {'name': 'get_debug_messages', type: "get",},
            },
            'autoUpdate': true,
        },
    }

    const sb = boardCtx.selectedBoard;
    const data = boardCtx.data;
    return (
        <main className={"main"}>
            {
                sb ?
                    <div className={"data-grid"}>
                        <div className={"group-card group-card-3"}>
                            <InfoCard k={"esc_speed"} value={data.esc_speed} structure={data_struct["esc_speed"]}
                                      dataHistory={boardCtx.escSpeedHistory}/>
                            <InfoCard k={"laser_measurements"} value={data.laser_measurements}
                                      structure={data_struct["laser_measurements"]}/>
                            <InfoCard k={"timing_budget"} value={data.timing_budget}
                                      structure={data_struct["timing_budget"]}/>
                        </div>
                        <div className={"group-card group-card-3"}>
                            <InfoCard k={"stepper_angular_speed"} value={data["stepper_angular_speed"]}
                                      structure={data_struct["stepper_angular_speed"]}
                                      dataHistory={boardCtx.stepperAngularSpeedHistory}/>

                            <InfoCard k={"stepper_angle"} value={data["stepper_angle"]}
                                      structure={data_struct["stepper_angle"]}
                            />
                            <InfoCard k={"stepper_max_speed"} value={data["stepper_max_speed"]}
                                      structure={data_struct["stepper_max_speed"]}/>
                        </div>
                        <div className={"group-card group-card-2"}>
                            <InfoCard k={"distance"} value={data.distance} structure={data_struct.distance}
                                      dataHistory={boardCtx.distanceHistory}/>
                            <InfoCard k={"distance_std_dev"} value={data.distance_std_dev}
                                      structure={data_struct.distance_std_dev}
                                      dataHistory={boardCtx.distanceSTDHistory}/>
                        </div>
                    </div>
                    : null
            }
        </main>
    );
}