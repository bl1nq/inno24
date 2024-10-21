import {InfoCard} from "./InfoCard";
import React from "react";
import {useBoard} from "../Context/BoardContext";
import {Data} from "../Types/Data";

export function GroupedInfoCard(props: { group: { key: string }[] }) {
    const boardCtx = useBoard();

    return (
        <div className={"group-card"}>
            {
                props.group.map(({key}) => {
                    return (
                        <InfoCard k={key} key={key} value={boardCtx.selectedBoard?.data[key as keyof Data]!}/>
                    )
                })
            }
        </div>
    )
}