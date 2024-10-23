import React, {createContext, PropsWithChildren, useEffect, useRef} from "react";
import {Board, InitialBoard} from "../Types/Board";
import {io, Socket} from "socket.io-client";
import {Data, DataHistory} from "../Types/Data";
import {useStore} from "./StoreContext";
import {Util} from "../Util";
import {useSettings} from "./SettingsContext";

const BoardContext = createContext<BoardContextType>({
    setSelectedBoard: () => {

    },
    selectedBoard: null,
    selectBoard: async () => null,
    boards: [],
    setBoards: () => {
    },
    syncBoard: async () => null,

    distanceHistory: [],
    distanceSTDHistory: [],
    escSpeedHistory: [],
    stepperAngularSpeedHistory: [],

    data: {
        'distance': 0.0,
        'distance_std_dev': 0.0,
        'esc_speed': 0,
        'stepper_angle': 0.0,
        'stepper_angular_speed': 0.0,
        'stepper_max_speed': 0.0,
        'laser_measurements': 0,
        'timing_budget': 0,
        'system_armed': false,
        'status_message': '',
        'debug_messages': [],
    }
});
const useBoard = () => React.useContext(BoardContext);

interface BoardContextType {
    setSelectedBoard: (board: Board | null) => void,
    selectedBoard: Board | null,
    selectBoard: (board: Board | InitialBoard) => Promise<Board | null>,
    boards: InitialBoard[],
    setBoards: ((boards: ((prevBoards: InitialBoard[]) => InitialBoard[])) => void),
    syncBoard: (board: Board) => Promise<Board | null>
    distanceHistory: DataHistory<number>,
    distanceSTDHistory: DataHistory<number>,
    escSpeedHistory: DataHistory<number>,
    stepperAngularSpeedHistory: DataHistory<number>,

    data: Data
}

function BoardProvider(props: PropsWithChildren<{}>) {
    let [selectedBoard, setSelectedBoard] = React.useState<Board | null>(null);

    let [boards, setBoards] = React.useState<InitialBoard[]>([]);

    let [escSpeed, setEscSpeed] = React.useState<number>(0);
    let [distance, setDistance] = React.useState<number>(0);
    let [distanceSTD, setDistanceSTD] = React.useState<number>(0);
    let [stepperAngle, setStepperAngle] = React.useState<number>(0);
    let [stepperAngularSpeed, setStepperAngularSpeed] = React.useState<number>(0);
    let [stepperMaxSpeed, setStepperMaxSpeed] = React.useState<number>(0);
    let [laserMeasurements, setLaserMeasurements] = React.useState<number>(0);
    let [timingBudget, setTimingBudget] = React.useState<number>(0);
    let [armed, setArmed] = React.useState<boolean>(false);
    let [status, setStatus] = React.useState<string>("");
    let [debugMessages, setDebugMessages] = React.useState<string[]>([]);

    let [escSpeedHistory, setEscSpeedHistory] = React.useState<DataHistory<number>>([]);
    let [distanceHistory, setDistanceHistory] = React.useState<DataHistory<number>>([]);
    let [distanceSTDHistory, setDistanceSTDHistory] = React.useState<DataHistory<number>>([]);
    let [stepperAngularSpeedHistory, setStepperAngularSpeedHistory] = React.useState<DataHistory<number>>([]);

    let [distanceHistoryPausedQueue, setDistanceHistoryPausedQueue] = React.useState<DataHistory<number>>([]);
    let [distanceSTDHistoryPausedQueue, setDistanceSTDHistoryPausedQueue] = React.useState<DataHistory<number>>([]);
    let [escSpeedHistoryPausedQueue, setEscSpeedHistoryPausedQueue] = React.useState<DataHistory<number>>([]);
    let [stepperAngularSpeedHistoryPausedQueue, setStepperAngularSpeedHistoryPausedQueue] = React.useState<DataHistory<number>>([]);

    const settingsCtx = useSettings();
    const settingsRef = useRef({
        pauseGraphUpdates: settingsCtx.pauseGraphUpdates,
        numPointsESCSpeed: settingsCtx.numPointsESCSpeed,
        numPointsStepperAngularSpeed: settingsCtx.numPointsStepperAngularSpeed,
        numPointsDistance: settingsCtx.numPointsDistance,
        numPointsDistanceStdDev: settingsCtx.numPointsDistanceStdDev,
    });

    useEffect(() => {
        if (settingsRef.current.pauseGraphUpdates !== settingsCtx.pauseGraphUpdates
            && !settingsCtx.pauseGraphUpdates) {
            setDistanceHistory((prev) => Util.visvalingamWhyatt([...prev, ...distanceHistoryPausedQueue], settingsRef.current.numPointsDistance));
            setDistanceSTDHistory((prev) => Util.visvalingamWhyatt([...prev, ...distanceSTDHistoryPausedQueue], settingsRef.current.numPointsDistanceStdDev));
            setEscSpeedHistory((prev) => Util.visvalingamWhyatt([...prev, ...escSpeedHistoryPausedQueue], settingsRef.current.numPointsESCSpeed));
            setStepperAngularSpeedHistory((prev) => Util.visvalingamWhyatt([...prev, ...stepperAngularSpeedHistoryPausedQueue], settingsRef.current.numPointsStepperAngularSpeed));
        }

        settingsRef.current = {
            pauseGraphUpdates: settingsCtx.pauseGraphUpdates,
            numPointsESCSpeed: settingsCtx.numPointsESCSpeed,
            numPointsStepperAngularSpeed: settingsCtx.numPointsStepperAngularSpeed,
            numPointsDistance: settingsCtx.numPointsDistance,
            numPointsDistanceStdDev: settingsCtx.numPointsDistanceStdDev,
        };
    }, [settingsCtx]);

    const storeCtx = useStore();

    useEffect(() => {
        const boards = storeCtx.get<{ [key: string]: Board }>("boards");
        if (boards) {
            setBoards(Object.values(boards));
        }
    }, [storeCtx.ready]);

    useEffect(() => {
        (window as any).selectedBoard = selectedBoard;
    }, [selectedBoard]);

    useEffect(() => {
    }, [distanceHistory]);

    async function selectBoard(board: InitialBoard) {
        return new Promise<Board | null>((resolve, reject) => {
            syncBoard(board)
                .then((syncedBoard) => {
                    setSelectedBoard(syncedBoard);
                    setBoards((prevBoards) => {
                        const newBoards = prevBoards.filter((b) => b.address !== board.address);
                        newBoards.push(board);
                        return newBoards;
                    });
                    resolve(syncedBoard);
                })
                .catch(reject);

        });
    }

    async function syncBoard(board: InitialBoard): Promise<Board | null> {
        return new Promise((resolve, reject) => {
            let c_error = 0;

            const newSocket: Socket = io(`${board.address}`, {
                timeout: 2000,
            });

            newSocket.on("connect", () => {
                Object.assign(board, {
                    data: {} as Data,
                    socket: newSocket,
                });
                newSocket.emit("get_data");
            });

            newSocket.on("connect_error", (err) => {
                c_error++;
                if (!newSocket.active || c_error > 3) {
                    newSocket.disconnect()
                    reject(err);
                }
            });

            newSocket.on("update_data", (data: Data) => {
                setDistance(data.distance);
                setDistanceSTD(data.distance_std_dev);
                setEscSpeed(data.esc_speed);
                setStepperAngle(data.stepper_angle);
                setStepperAngularSpeed(data.stepper_angular_speed);
                setStepperMaxSpeed(data.stepper_max_speed);
                setLaserMeasurements(data.laser_measurements);
                setTimingBudget(data.timing_budget);
                setArmed(data.system_armed);
                setStatus(data.status_message);

                setDebugMessages((prev) => [...prev].concat(debugMessages));
                setDistanceHistory((prev) => [...prev, {y: data.distance, x: Date.now()}]);
                setDistanceSTDHistory((prev) => [...prev, {y: data.distance_std_dev, x: Date.now()}]);
                setEscSpeedHistory((prev) => [...prev, {y: data.esc_speed, x: Date.now()}]);
                setStepperAngularSpeedHistory((prev) => [...prev, {y: data.stepper_angular_speed, x: Date.now()}]);

                resolve(board as Board);
            });

            newSocket.on("update_esc_speed", (data: number) => {
                setEscSpeed(data);
                if (settingsRef.current.pauseGraphUpdates) {
                    setEscSpeedHistoryPausedQueue((prev) => Util.visvalingamWhyatt([...prev, {
                        y: data,
                        x: Date.now()
                    }], settingsRef.current.numPointsESCSpeed));
                    return
                }
                setEscSpeedHistory((prev) => Util.visvalingamWhyatt([...prev, {
                    y: data,
                    x: Date.now()
                }], settingsRef.current.numPointsESCSpeed));
            });
            newSocket.on("update_distance", (data: number) => {
                setDistance(data);
                if (settingsRef.current.pauseGraphUpdates) {
                    setDistanceHistoryPausedQueue((prev) => Util.visvalingamWhyatt([...prev, {
                        y: data,
                        x: Date.now()
                    }], settingsRef.current.numPointsDistance));
                    return
                }
                setDistanceHistory((prev) => Util.visvalingamWhyatt([...prev, {
                    y: data,
                    x: Date.now()
                }], settingsRef.current.numPointsDistance));
            });
            newSocket.on("update_distance_std_dev", (data: number) => {
                setDistanceSTD(data);
                if (settingsRef.current.pauseGraphUpdates) {
                    setDistanceSTDHistoryPausedQueue((prev) => Util.visvalingamWhyatt([...prev, {
                        y: data,
                        x: Date.now()
                    }], settingsRef.current.numPointsDistanceStdDev));
                    return
                }
                setDistanceSTDHistory((prev) => Util.visvalingamWhyatt([...prev, {
                    y: data,
                    x: Date.now()
                }], settingsRef.current.numPointsDistanceStdDev));
            });
            newSocket.on("update_stepper_angle", (data: number) => {
                setStepperAngle(data);
            });
            newSocket.on("update_stepper_angular_speed", (data: number) => {
                setStepperAngularSpeed(data);
                if (settingsRef.current.pauseGraphUpdates) {
                    setStepperAngularSpeedHistoryPausedQueue((prev) => Util.visvalingamWhyatt([...prev, {
                        y: data,
                        x: Date.now()
                    }], settingsRef.current.numPointsStepperAngularSpeed));
                    return
                }
                setStepperAngularSpeedHistory((prev) => Util.visvalingamWhyatt([...prev, {
                    y: data,
                    x: Date.now()
                }], settingsRef.current.numPointsStepperAngularSpeed));
            });
            newSocket.on("update_stepper_max_speed", (data: number) => {
                setStepperMaxSpeed(data);
            });
            newSocket.on("update_laser_measurements", (data: number) => {
                setLaserMeasurements(data);
            });
            newSocket.on("update_timing_budget", (data: number) => {
                setTimingBudget(data);
            });
            newSocket.on("update_system_armed", (data: boolean) => {
                setArmed(data);
            });
            newSocket.on("update_status_message", (data: string) => {
                setStatus(data);
            });
            newSocket.on("update_debug_messages", (data: string[]) => {
                setDebugMessages((prev) => data.concat(prev));
            });
        });
    }

    return (
        <BoardContext.Provider
            value={{
                selectedBoard,
                selectBoard,
                boards,
                setBoards,
                syncBoard,
                setSelectedBoard,
                distanceHistory,
                distanceSTDHistory,
                escSpeedHistory,
                stepperAngularSpeedHistory,
                data: {
                    'distance': distance,
                    'distance_std_dev': distanceSTD,
                    'esc_speed': escSpeed,
                    'stepper_angle': stepperAngle,
                    'stepper_angular_speed': stepperAngularSpeed,
                    'stepper_max_speed': stepperMaxSpeed,
                    'laser_measurements': laserMeasurements,
                    'timing_budget': timingBudget,
                    'system_armed': armed,
                    'status_message': status,
                    'debug_messages': debugMessages,
                }
            }}>
            {props.children}
        </BoardContext.Provider>
    )
}

export {BoardContext, useBoard, BoardProvider};