import {Command} from "./Command";
import {Data, DataGroup, DataGrouping, DataHistory} from "./Data";
import {Address} from "./Address";
import {Socket} from "socket.io-client";

export interface InitialBoard extends Partial<Board>{
    name: string;
    address: Address;
    dataHistory: DataHistory
}

export interface StoredBoard extends Partial<Board> {
    name: string;
    address: Address;
}

export interface Board {
    name: string;
    address: Address;
    commands: Command[];
    data: Data;
    dataHistory: DataHistory;
    dataGrouping: DataGrouping;
    socket: Socket | null;
}

