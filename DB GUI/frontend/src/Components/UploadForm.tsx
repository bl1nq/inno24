import {Button, Form} from "react-bootstrap";
import React, {useRef} from "react";
import {useBoard} from "../Context/BoardContext";
import {Command} from "../Types/Command";

export function UploadForm({k, formatKey, command}: {
    k: string,
    formatKey: (key: string) => string,
    command: Command
}) {
    const boardCtx = useBoard();
    const formRef = useRef<HTMLFormElement | null>(null);
    let [newParam, setNewParam] = React.useState<number | string | boolean>();


    if (command.parameter && command.parameter.type) {
        return (
            <Form className={"new-values-grid"} key={k} ref={formRef}>

                <Form.Group key={k}>
                    <Form.Label
                        column={"sm"}
                        key={command.parameter.name}
                    >{formatKey(command.parameter.name)}</Form.Label>
                    {
                        (command.parameter.type === "number" && (
                            <Form.Control type={"number"}
                                          required={command.parameter.required}
                                          onChange={(ev) => {
                                              setNewParam(ev.target.value);
                                          }}
                            />
                        )) || (command.parameter.type === "string" && (
                            <Form.Control type={"text"}
                                          required={command.parameter.required}
                                          onChange={(ev) => {
                                              setNewParam(ev.target.value);
                                          }}
                            />
                        )) || (command.parameter.type === "percentage" && (
                            <Form.Control type={"range"} min={0} max={100}
                                          required={command.parameter.required}
                                          onChange={(ev) => {
                                              setNewParam(ev.target.value);
                                          }}
                            />
                        )) || (command.parameter.type === "boolean" && (
                            <Form.Check type={"checkbox"}
                                        required={command.parameter.required}
                                        onChange={(ev) => {
                                            setNewParam(ev.target.value);
                                        }}
                            />
                        ))
                    }
                </Form.Group>

                <Button onClick={() => {
                    if (!formRef.current?.checkValidity()) {
                        formRef.current?.reportValidity();
                        return;
                    }
                    console.log("Emitting", command.name, newParam, "to", boardCtx.selectedBoard?.name, boardCtx.selectedBoard?.socket);
                    boardCtx.selectedBoard?.socket?.emit(command.name, newParam);
                }
                }>Update</Button>
            </Form>
        )
    }
    return null;
}