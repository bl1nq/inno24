import React from "react";
import {Button} from "react-bootstrap";

export function Footer() {
    return (
        <footer className={"footer"}>
            <div className={"footer-content"}>
                <p>Version: {process.env.REACT_APP_VERSION}</p>
                <p>Created by {process.env.REACT_APP_AUTHOR}</p>
            </div>
        </footer>
    )
}