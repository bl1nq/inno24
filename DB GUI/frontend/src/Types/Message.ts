import {Data} from "./Data";

export type Message = UpdateMessage | DataMessage;

export type UpdateMessage = number
export type DataMessage = Data;