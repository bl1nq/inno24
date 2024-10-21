import {IOption, Option} from "./Option";
import Select, {StylesConfig} from "react-select";
import React from "react";
import {useBoard} from "../Context/BoardContext";

export function AddBoardSelect({
                                   setLoading, setShowNewBoard
                               }: {
    setLoading: (loading: boolean) => void,
    setShowNewBoard: (show: boolean) => void
}) {
    const boardCtx = useBoard();

    return (
        <Select
            formatGroupLabel={(data) => (
                <div>
                    <span>Select a Board</span>
                </div>
            )}
            components={{
                Option
            }}
            isClearable={true}
            isSearchable={true}
            styles={{
                menuList: (styles: any) => {
                    return {
                        ...styles,
                        padding: 0,
                    };
                },
                option: (styles: any, {isFocused, isSelected}) => {
                    return {
                        ...styles,
                        fontWeight: isSelected ? "bold" : "normal",
                        color: "#243642",
                        display: "flex",
                        justifyContent: "center",
                        padding: 0,
                        borderRadius: 5,

                        ':last-child': {
                            color: "gray",

                            '.custom-option-content': {
                                width: "100%",
                                display: "flex",
                                justifyContent: "center",
                            },
                            '.custom-option-remove': {
                                display: "none"
                            }

                        },
                    };
                },
                menu: (styles: any) => {
                    return {
                        ...styles,
                        margin: 0,
                        backgroundColor: "#E2F1E7",
                        borderRadius: 5
                    };
                }
            } as StylesConfig<IOption, false>}
            options={[
                ...boardCtx.boards.map(board => ({
                    value: board.address,
                    label: board.name,
                    setLoading,
                    setShowNewBoard
                })),
                {label: "Add Board", value: "", setLoading, setShowNewBoard}
            ]}
            isOptionSelected={(option) => {
                return boardCtx.selectedBoard?.address === option.value;
            }}

            onChange={(option) => {
                if (!option) {
                    boardCtx.setSelectedBoard(null);
                }
            }
            }
        />
    )
}