import React, {useContext, useMemo} from "react";
import {BoardContext} from "../Context/BoardContext";
import {GroupedInfoCard} from "./GroupedInfoCard";

export function Main() {
    const boardCtx = useContext(BoardContext);

    const mappedGrouping = useMemo(() => {
        if(!boardCtx.selectedBoard?.dataGrouping) return [];
        return boardCtx.selectedBoard.dataGrouping.map((group) => {
            return group.map((key) => {
                return {
                    key
                }
            });
        });
    },[boardCtx.selectedBoard,boardCtx.selectedBoard?.dataGrouping]);

    return (
        <main className={"main"}>
            <div className={"data-grid"}>
                {
                    mappedGrouping.map((group, i) => {
                        return (
                            <GroupedInfoCard key={i} group={group}/>
                        )
                    })
                }


            </div>

        </main>
    )
        ;
}