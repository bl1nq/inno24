import React, {createContext, PropsWithChildren, useEffect} from "react";
import {Board, InitialBoard, StoredBoard} from "../Types/Board";
import {io, Socket} from "socket.io-client";
import {Command} from "../Types/Command";
import {Data, DataGroup, DataGrouping, DataHistory} from "../Types/Data";
import {useStore} from "./StoreContext";

const BoardContext = createContext<BoardContextType>({
    setSelectedBoard: () => {

    },
    selectedBoard: null,
    selectBoard: async () => null,
    boards: [],
    setBoards: () => {
    },
    syncBoard: async () => null
});
const useBoard = () => React.useContext(BoardContext);

interface BoardContextType {
    setSelectedBoard: (board: Board | null) => void,
    selectedBoard: Board | null,
    selectBoard: (board: Board | InitialBoard) => Promise<Board | null>,
    boards: Board[],
    setBoards: ((boards: ((prevBoards: Board[]) => Board[])) => void),
    syncBoard: (board: Board) => Promise<Board | null>
}

function BoardProvider(props: PropsWithChildren<{}>) {
    let [selectedBoard, setSelectedBoard] = React.useState<Board | null>(null);
    let [boards, setBoards] = React.useState<Board[]>([]);
    const storeCtx = useStore();

    useEffect(() => {
        for (const board of boards) {
            const b = {...board} as StoredBoard;
            delete b.socket;
            delete b.commands;
            delete b.data;
            delete b.dataHistory;
            delete b.dataGrouping;
            storeCtx.set("boards", board.name, b);
        }
    }, [boards]);

    useEffect(() => {
        const boards = storeCtx.get<{ [key: string]: Board }>("boards");
        if (boards) {
            setBoards(Object.values(boards));
        }
    }, [storeCtx.ready]);


    async function selectBoard(board: Board | InitialBoard) {
        return new Promise<Board | null>((resolve, reject) => {
            if (board?.socket?.connected) {
                setSelectedBoard(board as Board);
                board.socket.emit("get_data");
                resolve(board as Board);
            } else {
                syncBoard(board)
                    .then((b) => {
                        setSelectedBoard(b);
                        setBoards((prevBoards) => {
                            const newBoards = prevBoards.filter((b) => b.address !== board.address);
                            if (b) newBoards.push(b);
                            return newBoards;
                        });
                        resolve(b);
                    })
                    .catch(reject);
            }
        });
    }

    /**
     * Resolves the board if it successfully connected and received all data and commands
     * Rejects if the connection failed
     * @param board
     */
    async function syncBoard(board: InitialBoard): Promise<Board | null> {
        return new Promise((resolve, reject) => {
            let c_error = 0;

            const newSocket: Socket = io(`${board.address}`, {
                timeout: 2000,
            });

            newSocket.on("connect", () => {
                newSocket.emit("get_commands");
                newSocket.emit("get_data");
            });

            newSocket.on("connect_error", (err) => {
                c_error++;
                if (!newSocket.active || c_error > 3) {
                    newSocket.disconnect()
                    reject(err);
                }
            });

            newSocket.on("commands", (commands: Command[]) => {
                board.commands = commands;

                if (board.data) {
                    resolve(board as Board);
                }
            });

            newSocket.on("update_data", (data: [Data, DataGrouping]) => {
                if (!board.data) {
                    initBoard(data, board);
                }
                for (const key of Object.keys(board.dataHistory) as (keyof Data)[]) {
                    board.dataHistory[key] = [
                        ...board.dataHistory[key],
                        [data[0][key] as number, Date.now()] as [number, number]
                    ]
                        .filter((v) => v[1] > Date.now() - 1000 * 60 * 5)
                        .slice(-100);

                    board.data = data[0];
                    board.dataGrouping = data[1];


                    setBoards((prevBoards) => {
                        const newBoards = prevBoards.filter((b) => b.address !== board.address);
                        newBoards.push(board as Board);
                        return newBoards;
                    });

                    setSelectedBoard(board as Board);

                    if (board.commands) {
                        resolve(board as Board);
                    }
                }
            })
        });
    }


    function initBoard(data: [Data, DataGrouping], board: InitialBoard): board is Board {
        board.dataHistory = {} as DataHistory;

        for (const key of Object.keys(data[0]) as (keyof Data)[]) {
            board.dataHistory[key] = [];
        }
        board.data = data[0];
        board.dataGrouping = data[1];
        return true;
    }

    return (
        <BoardContext.Provider
            value={{selectedBoard, selectBoard, boards, setBoards, syncBoard, setSelectedBoard}}>
            {props.children}
        </BoardContext.Provider>
    )
}

export {BoardContext, useBoard, BoardProvider};