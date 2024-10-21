import React, {useState} from "react";
import {Button, Form, InputGroup, Modal} from "react-bootstrap";
import {useBoard} from "../Context/BoardContext";
import {Address} from "../Types/Address";
import Select, {StylesConfig} from "react-select";
import {IOption, Option} from "./Option";
import {AddBoardSelect} from "./AddBoardSelect";
import {AddBoardModal} from "./AddBoardModal";


export function Header() {

    let [newBoardShowing, setShowNewBoard] = useState(false);
    let [loading, setLoading] = useState(false);




    return (
        <header className={"header"}>
            {
                loading && (
                    <div className={"loading"}>
                        <span className="loader"></span>
                    </div>
                )
            }

            <h1>Arduino Control Interface</h1>

            <div className={"connected-boards"}>
                <AddBoardSelect
                    setLoading={setLoading}
                    setShowNewBoard={setShowNewBoard}
                />
            </div>
            <AddBoardModal
                newBoardShowing={newBoardShowing}
                setShowNewBoard={setShowNewBoard}
                setLoading={setLoading}
            />
        </header>
    );
}