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

export function JsonButton({
    name,
    obj,
}: {
    name?: string,
    obj: unknown,
} & jsx.JSX.IntrinsicElements["button"]) {
    const text = jsonBeautify(obj, null as any, 2, 80);
    return <button
        title={"Click to copy to clipboard: " + text}
        onClick={() => {
            console.log(obj);
            navigator.clipboard.writeText(text);
        }}
    >{name ? name + " " : ""}JSON</button>;
}

const asciiStateMap = [".", "~", "x"] as const;

export function SubstanceView({
    substance,
}: jsx.JSX.IntrinsicElements["div"] & {
    substance: Ca238v1,
}) {
    const table = parseCa238v1Table(substance);
    const tablePic = table.map(d => asciiStateMap[d]);
    return <span>
        {substance.padStart(21, ".")}
        &nbsp;/&nbsp;
        {tablePic}
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

    const [reactionLog, setReactionLog] = useState<Array<{
        reagent: Ca238v1,
        rule: Ca238v1,
    }>>([]);

    const [currentReaction, setCurrentReaction] = useState<{
        reagent?: Ca238v1,
        rule?: Ca238v1,
    }>({});

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
                <SubstanceView substance={product} />
            </div>)}
            Reaagents:
            {problem.reagents.map((reagent, i) => <div key={i}>
                <SubstanceView substance={reagent} />
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
            <pre>{jsonBeautify(currentReaction, null as any, 2, 80)}</pre>
            {currentReaction.reagent !== undefined
                && currentReaction.rule !== undefined
                && Array.from({ length: 100 }).map((_, i) => {
                    const rule = currentReaction.rule!;
                    const reagent = currentReaction.reagent!;

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
                        <SubstanceView substance={substance} />
                        &nbsp;<button onClick={() => {
                            setCurrentReaction(update(currentReaction, {
                                reagent: { $set: substance },
                            }));
                        }}>as reagent</button>
                        &nbsp;<button onClick={() => {
                            setCurrentReaction(update(currentReaction, {
                                rule: { $set: substance },
                            }));
                        }}>as rule</button>
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
                        >
                            log
                        </button>
                    </div>;
                })}
            <pre>{jsonBeautify(reactionLog, null as any, 2, 80)}</pre>
        </div >
    );
}