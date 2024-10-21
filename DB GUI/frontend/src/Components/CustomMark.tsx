import {MarkElement, MarkElementProps} from "@mui/x-charts";

export function CustomMark(props: MarkElementProps) {
    return (
        <MarkElement {...props} shape={"circle"} classes={{root: "customMarkElement"}}/>
    )
}