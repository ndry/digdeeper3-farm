import { retroThemeCss } from "../nb-2023-07-06/retro-theme-css";

export default function Component() {
    return (
        <div css={[{
            fontSize: "0.71em",
            // display: "flex",
            // flexDirection: "column",
            padding: "1em",
        }, retroThemeCss]}>
            Hello World from {import.meta.url}
        </div >
    );
}

