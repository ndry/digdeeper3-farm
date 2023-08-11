import { useMemo, useState } from "react";
import { retroThemeCss } from "../nb-2023-07-06/retro-theme-css";
import jsonBeautify from "json-beautify";
import update from "immutability-helper";

// todo
// A bare minimum is a puzzle where you have
//  1 or 2 or N reagents, a ca-reactor, and a target product,
// and you have to semi-brute-force the reagents through the reactor
// to get the target product.
// There are 2 ways of getting better than brute force:
// 1. You get the intuition of what to expect from different cas 
//  and how to get them from reagents, 
//  and how to get the target product from known cas.
// 2. The (all/useful) recipes get aggregated by the community,
//  and you can use them.
// The unknowns here are if the intuition is possible to get, and if
//  the community recipes would be useful.
// To reduce the unknowns, we as developers should start gathering
//  the recipes as early as possible, and see if they work.

// The 2-state 111-neighborhood has 256 possible rules 
//  -> 256 possible substances.
// The 3-state 111-neighborhood has 7_625_597_484_987 ~= 8e12 possible rules.
// 256 feels too small (too easy to bruteforce), 8e12 feels big enough,
//  but a task to get 1 of 8e12 substances, compared bit to bit, looks harsh.

// What can we use instead of bit to bit comparison?
// That comparison should not process the substance too much,
//  so that it does not become a game in itself.
// Actually, a bit to bit comparison is not that bad,
//  just let it be a metric of how close the substance is to the target,
//  not just a boolean "is it the target or not".


import { HmacSHA256, enc } from "crypto-js";
import type * as CryptoJS from "crypto-js";
import { jsx } from "@emotion/react";
import { JsonButton } from "./json-button";


type WordArray = CryptoJS.lib.WordArray;



const ca238v1RuleSpaceSize = 3 ** (3 ** 3);
const ca238v1FromSeed = (seed: WordArray) => {
    let n = 1n;
    for (let i = 0; i < seed.words.length; i++) {
        n *= BigInt(seed.words[i] >>> 0);
    }
    n %= BigInt(ca238v1RuleSpaceSize);
    return `ca238v1_${Number(n)}` as const;
};
type Ca238v1 = ReturnType<typeof ca238v1FromSeed>;
const parseCa238v1Table = (substance: Ca238v1) => {
    const tablePacked = Number(substance.split("_")[1]);
    const tableStr = tablePacked.toString(3).padStart(27, "0");
    return [...tableStr].map(Number).reverse();
};

const getProblem = (seed: string) => {
    return {
        seed,
        reagents: [
            ca238v1FromSeed(HmacSHA256("reagents.0", seed)),
            ca238v1FromSeed(HmacSHA256("reagents.1", seed)),
            ca238v1FromSeed(HmacSHA256("reagents.2", seed)),
            ca238v1FromSeed(HmacSHA256("reagents.3", seed)),
            ca238v1FromSeed(HmacSHA256("reagents.4", seed)),
            ca238v1FromSeed(HmacSHA256("reagents.5", seed)),
            `ca238v1_${6354276578736}` as const, // wt1815
        ],
        products: [
            ca238v1FromSeed(HmacSHA256("products.0", seed)),
        ],
    };
};
type Problem = ReturnType<typeof getProblem>;
type ReactionSource = {
    reagent: Ca238v1,
    rule: Ca238v1,
    t: number,
};

const substanceSources = {} as Record<
    string,
    Array<Problem | ReactionSource>>;
const registerSubstanceSource = (
    substance: string,
    source: Problem | ReactionSource,
) => (substanceSources[substance] ??= []).push(source);

const asciiStateMap = [".", "~", "x"] as const;

export const scoreSubstance = (substance: Ca238v1, target: Ca238v1) => {
    const t1 = parseCa238v1Table(substance);
    const t2 = parseCa238v1Table(target);
    let s1 = 0;
    for (let i = t1.length - 1; i >= 0; i--) {
        if (t1[i] === t2[i]) {
            s1++;
            t1.splice(i, 1);
            t2.splice(i, 1);
        }
    }
    const s2 =
        Math.min(
            t1.filter(d => d === 0).length, t2.filter(d => d === 0).length)
        + Math.min(
            t1.filter(d => d === 1).length, t2.filter(d => d === 1).length)
        + Math.min(
            t1.filter(d => d === 2).length, t2.filter(d => d === 2).length);

    const score = s1 * 100 + s2;
    return score;
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const unlerp = (a: number, b: number, t: number) => (t - a) / (b - a);


export function SubstanceView({
    substance, comparisonTarget,
}: jsx.JSX.IntrinsicElements["div"] & {
    substance: Ca238v1,
    comparisonTarget?: Ca238v1,
}) {
    const score = comparisonTarget !== undefined
        ? scoreSubstance(substance, comparisonTarget)
        : undefined;
    return <span>
        {substance.padStart(21, ".")}
        &nbsp;/&nbsp;
        {parseCa238v1Table(substance).map(d => asciiStateMap[d])}
        &nbsp;/&nbsp;
        {(score ?? "").toString().padStart(5, ".")}
        &nbsp;
        {Array.from({ length: 10 }).map((_, i) => <span key={i}>{
            ((score ?? 0) / 2700) > (i / 10)
                ? "@"
                : "."
        }</span>)}
    </span>;
}

export function CompactSubstanceView({
    substance, comparisonTarget,
}: jsx.JSX.IntrinsicElements["div"] & {
    substance: Ca238v1,
    comparisonTarget?: Ca238v1,
}) {
    const score = comparisonTarget !== undefined
        ? scoreSubstance(substance, comparisonTarget)
        : undefined;
    return <span>
        {parseCa238v1Table(substance).map(d => asciiStateMap[d])}
        &nbsp;/&nbsp;
        {Array.from({ length: 10 }).map((_, i) => <span key={i}>{
            ((score ?? 0) / 2700) > (i / 10)
                ? "@"
                : "."
        }</span>)}
    </span>;
}


export default function Component() {
    const problemSeed = useMemo(() => HmacSHA256(

        "nb-2023-08-09-reactor-game",

        // new Date().toISOString() + Math.random(),
        "2023-22-22-22-22",
    ), []);

    const problem = useMemo(
        () => {
            const problem = getProblem(problemSeed.toString());
            for (const reagent of problem.reagents) {
                registerSubstanceSource(reagent, problem);
            }
            for (const product of problem.products) {
                registerSubstanceSource(product, problem);
            }
            return problem;
        },
        [problemSeed]);

    const [reactionLog, setReactionLog] = useState([{
        reagent: problem.reagents[0],
        rule: problem.reagents[1],
    }]);

    const setCurrentReaction = (reaction: typeof reactionLog[0]) => {
        setReactionLog(update(reactionLog, {
            $push: [reaction],
        }));
    };
    const currentReaction = reactionLog[reactionLog.length - 1] ?? {
        reagent: problem.reagents[0],
        rule: problem.reagents[1],
    };

    return (
        <div css={[{
            fontSize: "0.71em",
            display: "flex",
            flexDirection: "column",
            padding: "1em",
        }, retroThemeCss]}>
            Hello World from {import.meta.url}
            <JsonButton name="Problem" obj={problem} />
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
            </div>
        </div >
    );
}