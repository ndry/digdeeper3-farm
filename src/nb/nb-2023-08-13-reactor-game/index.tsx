import { useMemo, useState } from "react";
import { retroThemeCss } from "../nb-2023-07-06/retro-theme-css";
import jsonBeautify from "json-beautify";
import update from "immutability-helper";


import { HmacSHA256, SHA256, enc } from "crypto-js";
import type * as CryptoJS from "crypto-js";
import { jsx } from "@emotion/react";
import { JsonButton } from "./json-button";
import { Rule, keyifyTable, parseTable, ruleSpaceSize } from "../../ca237v1/rule-io";
import { getFullCombinedState } from "../../ca237v1/get-full-combined-state";
import { stateCount } from "../../ca237v1/state-count";
import { buildFullTransitionLookupTable } from "../../ca237v1/build-full-transition-lookup-table";


type WordArray = CryptoJS.lib.WordArray;


const ca237v1FromSeed = (seed: WordArray) => {
    let n = seed.words.reduce((n, w) => (n << 32n) + BigInt(w >>> 0), 0n);
    // assert(hash.toString() === n.toString(16).padStart(64, "0"));
    n %= BigInt(ruleSpaceSize);
    return `ca237v1_${n}` as const;
};

const s0 = (() => {
    const msg = "12d6 rolled 266-164-634-551"
        // eslint-disable-next-line max-len
        + " at 0x000000000000000000026d15f33764be84855e32d8ea6d73efa4c0a521b1976a / 2023-08-13T20:09:09.439Z"
        + " to reveal the structure of void";
    const seed = SHA256(msg);
    const s0 = ca237v1FromSeed(seed);
    return s0;
})();

const sShiftLeft = keyifyTable(buildFullTransitionLookupTable(
    stateCount,
    (stateCount, n1, c, n2, p) => {
        return n2;
    }));

const sShiftRight = keyifyTable(buildFullTransitionLookupTable(
    stateCount,
    (stateCount, n1, c, n2, p) => {
        return n1;
    }));

const sMiddleOne = keyifyTable(Array.from(
    { length: 81 },
    (_, i) => i === 40 ? 1 : 0));

const sRightOne = keyifyTable(Array.from(
    { length: 81 },
    (_, i) => i === 80 ? 1 : 0));

const sLeftOne = keyifyTable(Array.from(
    { length: 81 },
    (_, i) => i === 0 ? 1 : 0));

const sSum = keyifyTable(buildFullTransitionLookupTable(
    stateCount,
    (stateCount, n1, c, n2, p) => {
        return (c + p) % stateCount;
    }));

const runReactor = ({
    rule, reagent1, reagent2, t,
}: {
    rule: Rule, reagent1: Rule, reagent2: Rule, t: number,
}) => {
    const table = parseTable(rule);
    let prevSpace = parseTable(reagent1);
    let space = parseTable(reagent2);
    for (let ti = 0; ti < t; ti++) {
        const nextSpace = space.map((_, x) => table[getFullCombinedState(
            stateCount,
            space.at(x - 1)!,
            space[x],
            space.at(x - space.length + 1)!,
            prevSpace[x])]);
        prevSpace = space;
        space = nextSpace;
    }
    return {
        reagent1: keyifyTable(prevSpace),
        reagent2: keyifyTable(space),
    };
};
const rr = (rule: Rule, reagent1: Rule, reagent2: Rule, t: number) => ({
    rule, reagent1, reagent2, t,
});
const rrr = (log: {
    rule: Rule, reagent1: Rule, reagent2: Rule, t: number,
}[], rule: Rule, reagent1: Rule, reagent2: Rule, t: number) => {
    const r = rr(rule, reagent1, reagent2, t);
    log.push(r);
    return runReactor(r).reagent2;
};

// export type Reagent = "s0" | {
//     reactionIndex: number;
//     t: number;
//     reagentIndex: number;
// }

// export type Reaction = [rule: Rule, reagent1: Reagent, reagent2: Reagent];

// export const reactionLog: Reaction[] = [];
// export const registerReaction = (reaction: Reaction) => {
//     reactionLog.push(reaction);
// };
// export const resolveReagent = (reagent: Reagent) => {
//     if (reagent === "s0") { return s0; }
//     const reaction = reactionLog[reagent.reactionIndex];
//     const products = runReaction(reaction);
//     return products[reagent.reagentIndex];
// }
// export const runReaction = (reaction: Reaction) => {
//     const [rule, reagent1, reagent2] = reaction;
//     const products = [rule, reagent1, reagent2].map(resolveReagent);
//     return products;
// }

const asciiStateMap = ["·", "ı", "x"] as const;

export function SubstanceView({
    substance, ...props
}: jsx.JSX.IntrinsicElements["span"] & {
    substance: Rule,
}) {
    return <span {...props}>
        <a href={"./notes/?" + (() => {
            const s = new URLSearchParams();
            s.set("filter", JSON.stringify({ tags: substance }));
            return s.toString();
        })()}>
            {substance.padStart(47, ".")}
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


    console.log({ spacetime });

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


export function CompactSubstanceView({
    substance,
}: jsx.JSX.IntrinsicElements["div"] & {
    substance: Rule,
}) {
    return <span>
        {parseTable(substance).map(d => asciiStateMap[d])}
    </span>;
}


export default function Component() {
    const target = useMemo(() => ca237v1FromSeed(SHA256("target")), []);


    const x = useMemo(() => {
        const targetTable = parseTable(target);

        const log = [] as { rule: Rule, reagent1: Rule, reagent2: Rule, t: number }[];

        let sOne = sLeftOne;
        let sCurrent = s0;
        for (let i = 0; i < targetTable.length; i++) {
            if (parseTable(sCurrent)[i] !== targetTable[i]) {
                sCurrent = rrr(log, sSum, sCurrent, sOne, 1);
            }
            if (parseTable(sCurrent)[i] !== targetTable[i]) {
                sCurrent = rrr(log, sSum, sCurrent, sOne, 1);
            }

            let shift = 1;
            while (
                i < targetTable.length
                && parseTable(sCurrent)[i + 1] === targetTable[i + 1]
            ) {
                i++;
                shift++;
            }
            if (i < targetTable.length) {
                sOne = rrr(log, sShiftRight, sOne, sOne, shift);
            }
        }

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