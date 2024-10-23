import {useSettings} from "../Context/SettingsContext";
import {Form} from "react-bootstrap";

export function Settings() {
    const ctx = useSettings();

    return (
        <div className={"settings"}>
            <div className={"settings-numpoints"}>
                <Form>
                    <div>
                        <Form.Label column={"sm"}>Number of points for ESC speed graph:</Form.Label>
                        <Form.Control type={"number"} value={ctx.numPointsESCSpeed}
                                      onChange={(ev) => {
                                          ctx.setNumPointsESCSpeed(parseInt(ev.target.value) || 100);
                                      }}
                        />
                    </div>
                    <div>
                        <Form.Label column={"sm"}>Number of points for Stepper Angular Speed graph:</Form.Label>
                        <Form.Control type={"number"} value={ctx.numPointsStepperAngularSpeed}
                                      onChange={(ev) => {
                                          ctx.setNumPointsStepperAngularSpeed(parseInt(ev.target.value) || 100);
                                      }}
                        />
                    </div>
                    <div>
                        <Form.Label column={"sm"}>Number of points for Distance graph:</Form.Label>
                        <Form.Control type={"number"} value={ctx.numPointsDistance}
                                      onChange={(ev) => {
                                          ctx.setNumPointsDistance(parseInt(ev.target.value) || 100);
                                      }}
                        />
                    </div>
                    <div>
                        <Form.Label column={"sm"}>Number of points for Distance Std Dev graph:</Form.Label>
                        <Form.Control type={"number"} value={ctx.numPointsDistanceStdDev}
                                      onChange={(ev) => {
                                          ctx.setNumPointsDistanceStdDev(parseInt(ev.target.value) || 100);
                                      }}
                        />
                    </div>
                </Form>
            </div>
            <div></div>
            <div>
                <Form>
                    <Form.Check type={"checkbox"}
                                label={"Pause graph updates"}
                                checked={ctx.pauseGraphUpdates}
                                onChange={(ev) => {
                                    ctx.setPauseGraphUpdates(ev.target.checked);
                                }}
                    />
                </Form>
            </div>
        </div>
    )
}