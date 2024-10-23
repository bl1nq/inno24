import {useSettings} from "../Context/SettingsContext";
import {Form} from "react-bootstrap";
import {clearTimeout} from "node:timers";

export function Settings() {
    const ctx = useSettings();
    let t1: NodeJS.Timeout,
        t2: NodeJS.Timeout, t3: NodeJS.Timeout, t4: NodeJS.Timeout;


    return (
        <div className={"settings"}>
            <div className={"settings-numpoints"}>
                <Form>
                    <div>
                        <Form.Label column={"sm"}>Number of points for ESC speed graph:</Form.Label>
                        <Form.Control type={"number"} value={ctx.numPointsESCSpeed}
                                      onChange={(ev) => {
                                          clearTimeout(t1);
                                          t1 = setTimeout(() => {
                                              ctx.setNumPointsESCSpeed(parseInt(ev.target.value) || 100);
                                          }, 500);
                                      }}
                        />
                    </div>
                    <div>
                        <Form.Label column={"sm"}>Number of points for Stepper Angular Speed graph:</Form.Label>
                        <Form.Control type={"number"} value={ctx.numPointsStepperAngularSpeed}
                                      onChange={(ev) => {
                                          clearTimeout(t2);
                                          t2 = setTimeout(() => {
                                              ctx.setNumPointsStepperAngularSpeed(parseInt(ev.target.value) || 100);
                                          }, 500);
                                      }}
                        />
                    </div>
                    <div>
                        <Form.Label column={"sm"}>Number of points for Distance graph:</Form.Label>
                        <Form.Control type={"number"} value={ctx.numPointsDistance}
                                      onChange={(ev) => {
                                          clearTimeout(t3);
                                          t3 = setTimeout(() => {
                                              ctx.setNumPointsDistance(parseInt(ev.target.value) || 100);
                                          }, 500);
                                      }}
                        />
                    </div>
                    <div>
                        <Form.Label column={"sm"}>Number of points for Distance Std Dev graph:</Form.Label>
                        <Form.Control type={"number"} value={ctx.numPointsDistanceStdDev}
                                      onChange={(ev) => {
                                          clearTimeout(t4);
                                          t4 = setTimeout(() => {
                                              ctx.setNumPointsDistanceStdDev(parseInt(ev.target.value) || 100);
                                          }, 500);
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