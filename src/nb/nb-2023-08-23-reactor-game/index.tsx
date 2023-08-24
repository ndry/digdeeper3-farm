import { useEffect, useMemo, useState } from "react";
import { retroThemeCss } from "../nb-2023-07-06/retro-theme-css";
import jsonBeautify from "json-beautify";
import update from "immutability-helper";
import { HmacSHA256, SHA256, enc } from "crypto-js";
import { jsx } from "@emotion/react";
import { JsonButton } from "../nb-2023-08-13-reactor-game/json-button";
import { Rule, parseTable } from "../../ca237v1/rule-io";
import { createAutoRecipe } from "../nb-2023-08-13-reactor-game/recipes/create-auto-recipe";
import { s0 } from "../nb-2023-08-13-reactor-game/s0";
import { ca237v1FromSeed } from "../nb-2023-08-13-reactor-game/ca237v1-from-seed";
import { rrr } from "../nb-2023-08-13-reactor-game/run-reactor";
import { LinkCaPreview } from "../nb-2023-08-13-reactor-game/link-ca-preview";
import { createAutoRecipe60 } from "../nb-2023-08-13-reactor-game/recipes/create-auto-recipe-60";
import { createSingleOneAt60Substance } from "../nb-2023-08-13-reactor-game/recipes/create-single-one-at-60-substance";
import { createShiftSingleOneRightSubstance } from "../nb-2023-08-13-reactor-game/recipes/create-shift-single-one-right-substance";
import { ReactionView } from "./reaction-view";

const asciiStateMap = ["·", "ı", "x"] as const;


export function SubstanceView({
    substance,
    ...props
}: jsx.JSX.IntrinsicElements["span"] & {
    substance: Rule,
}) {
    const padLen = 47 - substance.length;
    const pad = Array.from({ length: padLen }, () => ".").join("");
    return <span {...props}>
        {pad}
        <LinkCaPreview substance={substance} />
        &nbsp;/&nbsp;
        {parseTable(substance).map(d => asciiStateMap[d])}
    </span>;
}

// sum mod 3:
// ···ıııxxx···ıııxxx···ıııxxxıııxxx···ıııx\
// xx···ıııxxx···xxx···ıııxxx···ıııxxx···ııı

export default function Component() {
    const target = useMemo(() => ca237v1FromSeed(SHA256("target")), []);

    // const x = useMemo(() => createAutoRecipe(s0, target), [target]);

    // const x = useMemo(() => {
    //     const log = [] as Parameters<typeof rrr>[0];
    //     const t0 = createAutoRecipe60(log, s0, target);
    //     return log;
    // }, [target]);
    const x = useMemo(() => {
        const log = [] as Parameters<typeof rrr>[0];

        const t0 = rrr(log, s0, s0, s0, 25);
        const t1 = rrr(log, t0, s0, s0, 10000);

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
            {x.map((reaction, i) => <ReactionView
                key={i}
                reaction={reaction}
            />)}
        </div >
    );
}