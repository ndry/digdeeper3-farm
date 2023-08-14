import { useMemo, useState } from "react";
import { retroThemeCss } from "../nb-2023-07-06/retro-theme-css";
import jsonBeautify from "json-beautify";
import update from "immutability-helper";


import { HmacSHA256, SHA256, enc } from "crypto-js";
import type * as CryptoJS from "crypto-js";
import { jsx } from "@emotion/react";
import { JsonButton } from "./json-button";
import { Rule, parseTable, ruleSpaceSize } from "../../ca237v1/rule-io";
import { getFullCombinedState } from "../../ca237v1/get-full-combined-state";
import { stateCount } from "../../ca237v1/state-count";


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

// todo sum rule
// todo 1 rule
// todo shift rule
// todo any rule from the above rules

const runReactor = ({
    rule, reagent1, reagent2, t,
}: {
    rule: Rule, reagent1: Rule, reagent2: Rule, t: number,
}) => {
    const table = parseTable(rule);
    let prevSpace = parseTable(reagent1);
    let space = parseTable(reagent1);
    for (let ti = 0; ti < t; ti++) {
        const nextSpace = space.map((_, x) => table[getFullCombinedState(
            stateCount,
            space.at(x - 1)!,
            space[x],
            space.at(x + 1)!,
            prevSpace[x])]);
        prevSpace = space;
        space = nextSpace;
    }
    return {
        reagent1: `ca237v1_${parseInt(prevSpace.reverse().join(""), 3)}` as const,
        reagent2: `ca237v1_${parseInt(space.reverse().join(""), 3)}` as const,
    };
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

const asciiStateMap = [".", "~", "x"] as const;

export function SubstanceView({
    substance,
}: jsx.JSX.IntrinsicElements["div"] & {
    substance: Rule,
}) {
    return <span>
        <a href={"./notes/?" + (() => {
            const s = new URLSearchParams();
            s.set("filter", JSON.stringify({ tags: substance }));
            return s.toString();
        })()}>
            {substance.padStart(50, ".")}
        </a>
        &nbsp;/&nbsp;
        {parseTable(substance).map(d => asciiStateMap[d])}
    </span>;
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
    return (
        <div css={[{
            fontSize: "0.71em",
            display: "flex",
            flexDirection: "column",
            padding: "1em",
        }, retroThemeCss]}>
            Hello World from {import.meta.url}
            <br />
            s0: <SubstanceView substance={s0} />
            {/* <JsonButton name="Problem" obj={problem} />
            Target products:
            {problem.products.map((product, i) => <div key={i}>
                <SubstanceView
                    substance={product}
                    comparisonTarget={problem.products[0]}
                />
            </div>)}
            Reaagents:
            {problem.reagents.map((reagent, i) => <div key={i}>
                <SubstanceView
                    substance={reagent}
                    comparisonTarget={problem.products[0]}
                />
                &nbsp;<button onClick={() => {
                    setCurrentReaction(update(currentReaction, {
                        reagent: { $set: reagent },
                    }));
                }}>as reagent</button>
                &nbsp;<button onClick={() => {
                    setCurrentReaction(update(currentReaction, {
                        rule: { $set: reagent },
                    }));
                }}>as rule</button>
            </div>)}
            <div css={{
                display: "flex",
                flexFlow: "row wrap",
                paddingTop: "1em",
            }}>
                {reactionLog.map((reaction, i) => <div
                    key={i}
                    css={{
                        fontSize: "0.6em",
                    }}
                >
                    <button onClick={() => {
                        setReactionLog(update(reactionLog, {
                            $splice: [[i, 1]],
                        }));
                    }}>x</button>
                    <br />
                    &#x2B4D; <SubstanceView
                        substance={reaction.rule}
                        comparisonTarget={problem.products[0]}
                    />
                    <br />
                    &#x269B; <SubstanceView
                        substance={reaction.reagent}
                        comparisonTarget={problem.products[0]}
                    />
                    {Array.from({ length: 30 }).map((_, i) => {
                        const { reagent, rule } = reaction;

                        const table = parseCa238v1Table(rule);
                        let space = parseCa238v1Table(reagent);
                        for (let t = 0; t < i; t++) {
                            space = space.map((_, x) => {
                                const left = space.at(x - 1)!;
                                const right = space.at(x - space.length + 1)!;
                                const center = space[x];
                                const cs = left * 9 + center * 3 + right;
                                return table[cs];
                            });
                        }
                        const substance =
                            `ca238v1_${parseInt(space.reverse().join(""), 3)}` as const;
                        return <div key={i}>
                            <CompactSubstanceView
                                substance={substance}
                                comparisonTarget={problem.products[0]}
                            />
                            &nbsp;<button onClick={() => {
                                setCurrentReaction(update(reaction, {
                                    reagent: { $set: substance },
                                }));
                            }}>&#x269B;</button>
                            &nbsp;<button onClick={() => {
                                setCurrentReaction(update(reaction, {
                                    rule: { $set: substance },
                                }));
                            }}>&#x2B4D;</button>
                            &nbsp;<button
                                onClick={() => {
                                    registerSubstanceSource(substance, {
                                        reagent,
                                        rule,
                                        t: i,
                                    });
                                    setReactionLog(update(reactionLog, {
                                        $push: [{ reagent, rule }],
                                    }));
                                }}
                            >&#x2710;</button>
                        </div>;
                    })}</div>)}
            </div> */}
        </div >
    );
}