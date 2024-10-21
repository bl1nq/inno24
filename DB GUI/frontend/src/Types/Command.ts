export interface Command {
    name: string;
    for: string;
    parameter: Parameter;
    type: "get" | "set" | "action";
}

export type Parameter = NumberParameter | StringParameter | BooleanParameter;

export interface IParameter {
    name: string;
    type: "number" | "string" | "boolean" | "percentage";
    required: boolean;
}


export interface NumberParameter extends IParameter {
    min: number;
    max: number;
    type: "number" | "percentage";
}

export interface StringParameter extends IParameter {
    type: "string";
}

export interface BooleanParameter extends IParameter {
    type: "boolean";
}

