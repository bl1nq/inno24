import {Command, Constraint} from "./Command";
import {DataKey} from "./Data";
import {Address} from "./Address";
import {Socket} from "socket.io-client";

export interface InitialBoard extends Partial<Board> {
    name: string;
    address: Address;
}

export interface Board {
    name: string;
    address: Address;
    socket: Socket | null;
}

export type Structure = {
    [key in DataKey]: DataStructure
};

export interface DataStructure {
    unit: string;
    type: "number" | "string" | "boolean" | "string[]";
    constraints: Constraint[];
    commands: {
        [key: string]: Command;
    };
    autoUpdate: boolean;
    graph?: {
        type: "line" | "circular";
        min?: number;
        max?: number;
    };
    heightScale?: number;
}