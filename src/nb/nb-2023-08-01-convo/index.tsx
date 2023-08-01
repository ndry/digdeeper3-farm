import { useState } from "react";
import { generateRandomRule } from "../../ca237v1/generate-random-rule";
import { retroThemeCss } from "../nb-2023-07-06/retro-theme-css";
import { RulePreview } from "./rule-preview";


export default function Component() {
    const spaceSize = 145;
    const timeSize = 1200;
    const scale = 1;
    const seed = 4242;

    const rules0 = [
        "ca237v1_210856206670641170713055541262311557598",
        "ca237v1_331982129536688414210736290212719951619",
        "ca237v1_369499511898124027676103393885048861552", // wt3_1815
    ] as const;

    const [rules1, setRules1] = useState([
        generateRandomRule(),
        generateRandomRule(),
        generateRandomRule(),
    ]);

    return <div css={
        [{
            fontSize: "0.7em",
            display: "flex",
            flexDirection: "column",
            padding: "1em",
        }, retroThemeCss]
    }>
        Hello World from {import.meta.url}
        {[...rules0, ...rules1].map((rule, i) => <RulePreview
            key={i}
            rule={rule}
            spaceSize={spaceSize}
            timeSize={timeSize}
            scale={scale}
            seed={seed}
        />)}
        <button onClick={() => setRules1([
            generateRandomRule(),
            generateRandomRule(),
            generateRandomRule(),
        ])}>Randomize</button>
    </div>;
}