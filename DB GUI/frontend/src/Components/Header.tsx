import React, {useState} from "react";
import {Button, Form, InputGroup, Modal, Offcanvas} from "react-bootstrap";
import {useBoard} from "../Context/BoardContext";
import {Address} from "../Types/Address";
import Select, {StylesConfig} from "react-select";
import {IOption, Option} from "./Option";
import {AddBoardSelect} from "./AddBoardSelect";
import {AddBoardModal} from "./AddBoardModal";
import {FaCog} from "react-icons/fa";
import {Settings} from "./Settings";


export function Header() {
    let [showSettings, setShowSettings] = useState(false);
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
                <Button onClick={() => {
                setShowSettings(true);
            }}><FaCog/></Button>
            </div>
            <></>
            <AddBoardModal
                newBoardShowing={newBoardShowing}
                setShowNewBoard={setShowNewBoard}
                setLoading={setLoading}
            />
            <Offcanvas
                placement={"top"}
                show={showSettings} onHide={() => {
                setShowSettings(false);
            }}>
                <Offcanvas.Header closeButton closeVariant={"white"}>
                    <Offcanvas.Title>Settings</Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body>
                    <Settings/>
                </Offcanvas.Body>
            </Offcanvas>
        </header>
    );
}