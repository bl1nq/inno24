export interface Command {
    name: string;
    parameter?: Parameter;
    type: "get" | "set" | "action";
}

export type Parameter = {
    name: string;
    type: "number" | "string" | "boolean" | "percentage";
    constraints?: Constraint[];
    required: boolean;
}

export type Constraint = number | [number, number];