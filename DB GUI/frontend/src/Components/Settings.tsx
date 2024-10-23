import { useSettings } from "../Context/SettingsContext";
import { Form } from "react-bootstrap";
import React, { useEffect, useRef } from "react";

export function Settings() {
    const ctx = useSettings();

    // Use state hooks for the form inputs
    const [s1, setS1] = React.useState(ctx.numPointsESCSpeed);
    const [s2, setS2] = React.useState(ctx.numPointsStepperAngularSpeed);
    const [s3, setS3] = React.useState(ctx.numPointsDistance);
    const [s4, setS4] = React.useState(ctx.numPointsDistanceStdDev);

    // Use refs to store timeout IDs
    const timeoutRef = useRef<{
        [key: string]: NodeJS.Timeout
    }>({});

    // Generic function to update settings context with a delay
    const updateSetting = (key: string, value: number, setter: (x:number) => void) => {
        // Clear existing timeout for the key
        if (timeoutRef.current[key]) {
            clearTimeout(timeoutRef.current[key]);
        }

        // Set a new timeout to delay the update
        timeoutRef.current[key] = setTimeout(() => {
            setter(value);  // Call the context setter function
        }, 500);
    };

    // UseEffect for each input to trigger the updateSetting function on change
    useEffect(() => {
        updateSetting('escSpeed', s1, ctx.setNumPointsESCSpeed);
    }, [s1]);

    useEffect(() => {
        updateSetting('stepperAngularSpeed', s2, ctx.setNumPointsStepperAngularSpeed);
    }, [s2]);

    useEffect(() => {
        updateSetting('distance', s3, ctx.setNumPointsDistance);
    }, [s3]);

    useEffect(() => {
        updateSetting('distanceStdDev', s4, ctx.setNumPointsDistanceStdDev);
    }, [s4]);

    return (
        <div className={"settings"}>
            <div className={"settings-numpoints"}>
                <Form>
                    <div>
                        <Form.Label column={"sm"}>Number of points for ESC speed graph:</Form.Label>
                        <Form.Control
                            type={"number"}
                            value={s1}
                            onChange={(ev) => setS1(parseInt(ev.target.value) || 0)} />
                    </div>
                    <div>
                        <Form.Label column={"sm"}>Number of points for Stepper Angular Speed graph:</Form.Label>
                        <Form.Control
                            type={"number"}
                            value={s2}
                            onChange={(ev) => setS2(parseInt(ev.target.value) || 0)} />
                    </div>
                    <div>
                        <Form.Label column={"sm"}>Number of points for Distance graph:</Form.Label>
                        <Form.Control
                            type={"number"}
                            value={s3}
                            onChange={(ev) => setS3(parseInt(ev.target.value) || 0)} />
                    </div>
                    <div>
                        <Form.Label column={"sm"}>Number of points for Distance Std Dev graph:</Form.Label>
                        <Form.Control
                            type={"number"}
                            value={s4}
                            onChange={(ev) => setS4(parseInt(ev.target.value) || 0)} />
                    </div>
                </Form>
            </div>
            <div></div>
            <div>
                <Form>
                    <Form.Check
                        type={"checkbox"}
                        label={"Pause graph updates"}
                        checked={ctx.pauseGraphUpdates}
                        onChange={(ev) => ctx.setPauseGraphUpdates(ev.target.checked)} />
                </Form>
            </div>
        </div>
    );
}
