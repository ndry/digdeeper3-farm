import { useMemo, useState } from "react";
import { retroThemeCss } from "../nb-2023-07-06/retro-theme-css";
import jsonBeautify from "json-beautify";
import update from "immutability-helper";
import { HmacSHA256, SHA256, enc } from "crypto-js";
import { jsx } from "@emotion/react";
import { JsonButton } from "./json-button";
import { Rule, keyifyTable, parseTable } from "../../ca237v1/rule-io";
import { getFullCombinedState } from "../../ca237v1/get-full-combined-state";
import { stateCount } from "../../ca237v1/state-count";
import { createAutoRecipe } from "./create-auto-recipe";
import { s0 } from "./s0";
import { ca237v1FromSeed } from "./ca237v1-from-seed";
import { rrr } from "./run-reactor";





const asciiStateMap = ["·", "ı", "x"] as const;

export function SubstanceView({
    substance, ...props
}: jsx.JSX.IntrinsicElements["span"] & {
    substance: Rule,
}) {
    const padLen = 47 - substance.length;
    const pad = Array.from({ length: padLen }, () => ".").join("");
    return <span {...props}>
        {pad}
        <a href={"./notes/?" + (() => {
            const s = new URLSearchParams();
            s.set("filter", JSON.stringify({ tags: substance }));
            return s.toString();
        })()}>
            {substance}
        </a>
        &nbsp;/&nbsp;
        {parseTable(substance).map(d => asciiStateMap[d])}
    </span>;
}

export function ReactionView({
    rule, reagent1, reagent2, t,
}: {
    rule: Rule, reagent1: Rule, reagent2: Rule, t: number,
}) {
    const table = parseTable(rule);
    const spacetime = [
        parseTable(reagent1),
        parseTable(reagent2),
    ];

    while (spacetime.length < t + 2) {
        const prevSpace = spacetime[spacetime.length - 2];
        const space = spacetime[spacetime.length - 1];
        const nextSpace = space.map((_, x) => table[getFullCombinedState(
            stateCount,
            space.at(x - 1)!,
            space[x],
            space.at(x - space.length + 1)!,
            prevSpace[x])]);
        spacetime.push(nextSpace);
    }

    return <div
        css={{
            border: "1px solid #00ff0044",
            padding: "0.5em",
        }}
    >
        Reaction: <br />
        &#x2B4D;<SubstanceView substance={rule} />
        <br />
        <br />
        {spacetime.map((space, i) => <div key={i}>
            &#x269B;
            <SubstanceView
                substance={keyifyTable(space)}
            />
        </div>)}
    </div>;
}

export default function Component() {
    const target = useMemo(() => ca237v1FromSeed(SHA256("target")), []);

    // const x = useMemo(() => createAutoRecipe(s0, target), [target]);
    const x = useMemo(() => {
        const log = [] as Parameters<typeof rrr>[0];

        const t0 = rrr(log, s0, s0, s0, 6);
        const t1 = rrr(log, t0, s0, s0, 22);
        const t2 = rrr(log, t1, s0, s0, 22);
        const t3 = rrr(log, t2, s0, t1, 5);
        const t4 = rrr(log, s0, t1, t3, 1);

        return log;
    }, [target]);

    return (
        <div css={[{
            fontSize: "0.71em",
            // display: "flex",
            // flexDirection: "column",
            padding: "1em",
        }, retroThemeCss]}>
            Hello World from {import.meta.url}
            <br />
            s0: <SubstanceView substance={s0} />

            <br />
            .t: <SubstanceView substance={target} />
            <br />
            <JsonButton name="x" obj={x} />
            {x.map((reaction, i) => <ReactionView key={i} {...reaction} />)}
        </div >
    );
}