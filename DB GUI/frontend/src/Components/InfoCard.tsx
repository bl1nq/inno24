import {Card} from "react-bootstrap";
import {LineChart} from "@mui/x-charts";
import {Data} from "../Types/Data";
import {UploadForm} from "./UploadForm";
import React, {useMemo, useRef} from "react";
import {useBoard} from "../Context/BoardContext";
import {Command, NumberParameter} from "../Types/Command";
import {CustomMark} from "./CustomMark";

export function InfoCard({k, value}: { k: string, value: string | number | boolean | string[] }) {
    const formatKey = (k: string) => {
        let keyParts = k.split(/(?<=[a-z])(?=[A-Z])|_/);
        keyParts = keyParts.map(part => part.charAt(0).toUpperCase() + part.slice(1));
        return keyParts.join(" ");
    }

    const boardCtx = useBoard();

    const findCommand = useMemo<Command | undefined>((): Command | undefined => {
        return boardCtx.selectedBoard?.commands.find(cmd => cmd.for === k);
    }, [boardCtx.selectedBoard, k]);

    const mapToType = useMemo<string>(() => {
        return boardCtx.selectedBoard?.commands.find(cmd => cmd.for === k)?.parameter.type || typeof value;
    }, [boardCtx.selectedBoard?.commands, k]);

    const bodyRef = useRef<HTMLDivElement | null>(null);

    return (
        <>
            <Card key={k} className={"data-card"}>
                <Card.Header>{formatKey(k)}</Card.Header>
                <Card.Body ref={bodyRef}>
                    {
                        Array.isArray(value) ? value.map((v, i) => <Card.Text key={i}>{v}</Card.Text>) :
                            <Card.Text>{value}</Card.Text>
                    }
                    {
                        mapToType === "number" && (
                            <>
                                <hr/>
                                <LineChart width={(bodyRef.current?.clientWidth || 50) - 50}
                                           height={(bodyRef.current?.clientWidth || 50) - 50}
                                           xAxis={[
                                               {
                                                   valueFormatter: (value: Date) => value.toLocaleTimeString(),
                                                   scaleType: "time",
                                                   data: boardCtx.selectedBoard?.dataHistory[k as keyof Data]?.map((v) => new Date(v[1])) || []
                                               }
                                           ]}
                                           margin={{top: 50, right: 50, bottom: 50, left: 50}}
                                           yAxis={[{
                                               scaleType: "linear",
                                               min: (findCommand?.parameter as NumberParameter)?.min || 0,
                                               max: (findCommand?.parameter as NumberParameter)?.max || 100,
                                           }]}
                                           skipAnimation={true}
                                           series={[{
                                               curve: "linear",
                                               data: boardCtx.selectedBoard?.dataHistory[k as keyof Data]?.map((v) => v[0]) || [],

                                           }]}
                                           slots={{
                                               mark: CustomMark,
                                           }}
                                           key={k + "chart"}
                                           sx={{
                                               "& .customMarkElement": {
                                                   scale: "0.5",
                                               }
                                           }}
                                >

                                </LineChart>
                            </>
                        )
                    }
                    {
                        findCommand && (
                            <>
                                <hr key={k + "hr"}/>

                                <UploadForm key={k} k={k} formatKey={formatKey} command={findCommand}/>
                            </>
                        )
                    }

                </Card.Body>
            </Card>

        </>
    )
}