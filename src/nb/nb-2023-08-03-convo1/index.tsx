import { Fragment, useState } from "react";
import { generateRandomRule } from "../../ca237v1/generate-random-rule";
import { retroThemeCss } from "../nb-2023-07-06/retro-theme-css";
import { generateRandomSymmetricalRule } from "../../ca237v1/generate-random-symmetrical-rule";
import { RulePreview1 } from "./rule-preview-1";
import { keyifyTable } from "../../ca237v1/rule-io";
import { buildFullTransitionLookupTable } from "../../ca237v1/build-full-transition-lookup-table";
import { stateCount } from "../../ca237v1/state-count";



export const generateRandomRule1 = (random01 = Math.random) => {
    const table = Array.from(
        { length: 3 ** 3 },
        () => Math.floor(random01() * stateCount));

    return keyifyTable(
        buildFullTransitionLookupTable(
            stateCount,
            (_, n1, c, n2, pc) => table[
                (n1 * stateCount + c) * stateCount + n2]));
};

export default function Component() {
    const window = 8;
    const spaceSize = 200 * window;
    const timeSize = 800 * window;
    const scale = 1;
    const seed = 4242;

    // const gen = generateRandomRule();
    const gen = generateRandomSymmetricalRule;
    const genCount = 2;

    const rules0 = [
        // "ca237v1_210856206670641170713055541262311557598",
        // "ca237v1_331982129536688414210736290212719951619",
        "ca237v1_369499511898124027676103393885048861552", // wt3_1815
    ] as const;


    const [rules1, setRules1] = useState(() => Array.from({ length: genCount }, gen));

    return <div css={[{
        fontSize: "0.7em",
        display: "flex",
        flexDirection: "column",
        padding: "1em",
    }, retroThemeCss]}>
        Hello World from {import.meta.url}
        <button onClick={() => setRules1(Array.from({ length: genCount }, gen))}>
            Randomize
        </button>
        <div css={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
        }}>
            {[...rules0, ...rules1].map((rule, i) => <div
                key={i}
                css={{
                    border: "1px solid lime",
                }}
            >
                {/* <RulePreview
                rule={rule}
                spaceSize={spaceSize}
                timeSize={timeSize}
                scale={scale}
                seed={seed}
            /> */}
                <RulePreview1
                    rule={rule}
                    spaceSize={spaceSize}
                    timeSize={timeSize}
                    scale={scale}
                    seed={seed}
                    window={window}
                    css={{ padding: "0.1em" }}
                />
                {/* <RulePreview2
                    rule={rule}
                    spaceSize={spaceSize}
                    timeSize={timeSize}
                    scale={scale}
                    seed={seed}
                    window={window}
                    css={{ padding: "0.1em" }}
        /> */}
            </div>)}
        </div>
    </div >;
}