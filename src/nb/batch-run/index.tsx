import { retroThemeCss } from "../nb-2023-07-06/retro-theme-css";

export default function App() {
    return <div css={[{
        fontSize: "0.7em",

        display: "flex",
        flexDirection: "column",
        padding: "1em",
    }, retroThemeCss]}>
        Hello!
    </div>;
}