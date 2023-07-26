import { retroThemeCss } from "../nb-2023-07-06/retro-theme-css";
import { Massage } from "./Massage";


export default function App() {

    const massages = [
        {
            tags: ["#tag1", "#tag2", "#tag3"],
            msg: ["msg new world 0", "msg2"],
            ca: {
                v: "digdeeper3/ca@2",
                stateCount: 3,
                rule: "391938529781602641575669815881786823420",
            },
        },
        {
            tags: ["#tag1", "#tag2", "#tag3"],
            msg: ["msg new world 1", "msg2"],
            ca: {
                v: "digdeeper3/ca@2",
                stateCount: 3,
                rule: "391938529781602641575601815881786823420",
            },
        },
    ];

    return <div css={
        [{
            fontSize: "0.7em",
            display: "flex",
            flexDirection: "column",
            padding: "1em",
            alignItems: "center",
        }, retroThemeCss]
    }>
        <h1>All information about CA previously encountered in research:</h1>
        {massages.map(
            (v, i) => {
                return <Massage
                    key={i}
                    massages={v}
                    />;
            })}
    </div>;
}