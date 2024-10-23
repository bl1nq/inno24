import {Card} from "react-bootstrap";
import {DataHistory, DataKey, DataType} from "../Types/Data";
import {UploadForm} from "./UploadForm";
import React, {useEffect, useRef} from "react";
import {Line} from "./Line";
import {DataStructure} from "../Types/Board";
import D3LineChart from "./LineChart";
import {Gauge} from "./Gauge";

export function InfoCard({k, value, structure, dataHistory}: {
    k: DataKey,
    value: DataType,
    structure: DataStructure,
    dataHistory?: DataHistory
}) {
    let [min, setMin] = React.useState<number>(0);
    let [max, setMax] = React.useState<number>(0);

    const formatKey = (k: string) => {
        let keyParts = k.split(/(?<=[a-z])(?=[A-Z])|_/);
        keyParts = keyParts.map(part => part.charAt(0).toUpperCase() + part.slice(1));
        return keyParts.join(" ");
    }

    const bodyRef = useRef<HTMLDivElement | null>(null);


    useEffect(() => {
        if (value < min) setMin(value as number);
        if (value > max) setMax(value as number);
    }, [value]);

    return (
        <>
            <Card key={k} className={"data-card"}>
                <Card.Header>{formatKey(k)}</Card.Header>
                <Card.Body ref={bodyRef}>
                    {
                        (!structure?.graph || structure.graph.type !== "circular") && (Array.isArray(value) ? value.map((v, i) =>
                                    <Card.Text
                                        key={i}>{v}</Card.Text>) :
                                structure?.type === "number" ?
                                    <Card.Text>{(value as number).toFixed(2)} {structure.unit}</Card.Text> :
                                    <Card.Text>{value}</Card.Text>
                        )
                    }
                    {
                        structure?.graph?.type === "line" && dataHistory && (
                            <>
                                <Line/>
                                <D3LineChart
                                    unit={structure.unit}
                                    data={dataHistory as DataHistory<number>}
                                    width={bodyRef.current?.clientWidth || 200}
                                    height={(bodyRef.current?.clientWidth || 200) * (structure.heightScale || 1)}
                                    key={k + "line"}
                                    minY={min}
                                    maxY={max}
                                />
                            </>
                        )
                    }
                    {
                        structure?.graph?.type === "circular" && (
                            <>
                            <Gauge  width={bodyRef.current?.clientWidth || 200}
                                    height={(bodyRef.current?.clientWidth || 200) * (structure.heightScale || 1)}
                                   startAngle={90}
                                   endAngle={-90}
                                   minValue={structure.graph.min || 0}
                                   maxValue={structure.graph.max || 360}
                                   value={value as number}
                                   unit={structure.unit}
                            />
                            </>
                            )
                            }
                            {
                                structure?.commands["set"] && (
                                    <>
                                        <UploadForm key={k} k={k} formatKey={formatKey} command={structure.commands["set"]}/>
                                    </>
                                )
                            }

                            </Card.Body>
                        </Card>

                        </>
                        )
                    }