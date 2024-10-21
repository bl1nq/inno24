import {components, OptionProps} from "react-select";
import {MdDeleteOutline} from "react-icons/md";
import {useBoard} from "../Context/BoardContext";
import {Board} from "../Types/Board";
import {useStore} from "../Context/StoreContext";

export interface IOption {
    label: string;
    value: string;
    setLoading: (loading: boolean) => void;
    setShowNewBoard: (show: boolean) => void;
}

export function Option(props: OptionProps<IOption, false>) {
    const boardCtx = useBoard();
    const storeCtx = useStore();

    return (
        <components.Option {...props}>
            <div className={"custom-option"}>
                <div className={"custom-option-content"} onClick={async (ev) => {
                    if (!ev) return;
                    if (props.data.label === "Add Board") {
                        props.data.setShowNewBoard(true);
                    } else {
                        props.data.setLoading(true);
                        boardCtx.selectBoard(
                            boardCtx.boards.find(board => board.address === props.data.value) as Board
                        ).catch((err) => {
                            alert(`Failed to connect to board: ${err}`);
                        }).finally(() => {
                            props.data.setLoading(false);
                        });
                    }
                }}>
                    <div>
                        {
                            props.data.label
                        }
                    </div>
                    <div>
                        {
                            props.data.value
                        }
                    </div>
                </div>
                <div onClick={() => {
                    storeCtx.remove("boards", props.data.label);

                    boardCtx.setBoards((prevBoards) => {
                        return prevBoards.filter((b) => b.address !== props.data.value);
                    });

                    if (boardCtx.selectedBoard?.address === props.data.value) {
                        boardCtx.setSelectedBoard(null);
                    }
                }} className={"custom-option-remove"}>
                    <MdDeleteOutline color={"red"} size={24}/>
                </div>
            </div>
        </components.Option>
    )
        ;
}