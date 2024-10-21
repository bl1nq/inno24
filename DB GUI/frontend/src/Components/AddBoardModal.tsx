import {Button, Form, Modal} from "react-bootstrap";
import React from "react";
import {useBoard} from "../Context/BoardContext";
import {Address} from "../Types/Address";
import {Board, InitialBoard} from "../Types/Board";
import {useStore} from "../Context/StoreContext";

export function AddBoardModal({
                                  newBoardShowing,
                                  setShowNewBoard,
                                  setLoading
                              }: {
    newBoardShowing: boolean,
    setShowNewBoard: (show: boolean) => void,
    setLoading: (loading: boolean) => void
}) {
    let formRef = React.createRef<HTMLFormElement>();

    let modalName = React.createRef<HTMLInputElement>();
    let modalAddress = React.createRef<HTMLInputElement>();
    let modalPort = React.createRef<HTMLInputElement>();

    const ipRegex = "^(\\b25[0-5]|\\b2[0-4][0-9]|\\b[01]?[0-9][0-9]?)(\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$";
    const portRegex = "^((6553[0-5])|(655[0-2][0-9])|(65[0-4][0-9]{2})|(6[0-4][0-9]{3})|([1-5][0-9]{4})|([0-5]{0,5})|([0-9]{1,4}))$";

    const boardCtx = useBoard();
    const storeCtx = useStore();

    function addBoard() {
        if (!formRef.current?.checkValidity()) {
            formRef.current?.reportValidity();
            return;
        }
        setLoading(true);
        boardCtx.selectBoard({
            name: modalName.current?.value as string,
            address: `${modalAddress.current?.value}:${modalPort.current?.value}` as Address,
            dataHistory: {}
        } as InitialBoard).then((board: Board | null) => {
            if (board) {
                storeCtx.set("boards", board.name as string, board);
            }
            setShowNewBoard(false);
        }).catch((err) => {
            alert(`Failed to connect to board: ${err}`);
        }).finally(() => {
            setLoading(false);
        });
    }


    return (
        <Modal show={newBoardShowing} onHide={() => {
            setShowNewBoard(false);
        }}>
            <Modal.Header closeButton>
                <Modal.Title>Add New Board</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form ref={formRef}>
                    <Form.Group>
                        <Form.Label column={"sm"}>Name</Form.Label>
                        <Form.Control type="text"
                                      placeholder="Board Name"
                                      ref={modalName}
                                      required={true}/>
                    </Form.Group>
                    <Form.Group className={"address-form"}>
                        <Form.Label column={"sm"}>Address</Form.Label>
                        <Form.Label column={"sm"}>Port</Form.Label>
                        <Form.Control type="text"
                                      placeholder="0.0.0.0"
                                      ref={modalAddress}
                                      required={true}
                                      pattern={ipRegex}

                        />
                        <Form.Control type="text"
                                      placeholder="65535"
                                      ref={modalPort}
                                      required={true}
                                      pattern={portRegex}
                        />
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button onClick={() => {
                    addBoard();
                }}>Add
                </Button>
                <Button onClick={() => {
                    setShowNewBoard(false);
                }} variant={"secondary"}>Cancel
                </Button>
            </Modal.Footer>
        </Modal>
    )
}