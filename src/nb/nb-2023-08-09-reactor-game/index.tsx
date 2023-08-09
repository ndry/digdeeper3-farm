import { useState } from "react";
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

export default function Component() {

    const [state, setState] = useState(() => ({
        energy: 100,
        warehouse: {
            17: 1,
        } as Record<number, number>,
        market: {
            45: 1,
            120: 100,
            144: -1,
            17: -100,
        } as Record<number, number>,
        reactor: {
            load: undefined as number | undefined,
            rule: undefined as number | undefined,
        },
    }));

    return (
        <div css={[{
            fontSize: "0.7em",
            display: "flex",
            flexDirection: "column",
            padding: "1em",
        }, retroThemeCss]}>
            Hello World from {import.meta.url}
            <pre css={{ fontSize: "1.4em" }}>
                {jsonBeautify(state, null as any, 2, 80)}
            </pre>
            <div>Energy: {state.energy}</div>
            <div>
                Warehouse:
                {Object.entries(state.warehouse).map(([ware, count], i) => <div key={i}>
                    "{ware}" x {count}
                    <button
                        onClick={() => {
                            const currentLoad = state.reactor.load;
                            if (currentLoad === undefined) {
                                setState(update(state, {
                                    warehouse: {
                                        [ware]: {
                                            $set: (state.warehouse[ware] ?? 0) - 1,
                                        },
                                    },
                                    reactor: { load: { $set: Number(ware) } },
                                }));
                            } else {
                                setState(update(state, {
                                    warehouse: {
                                        [ware]: {
                                            $set: (state.warehouse[ware] ?? 0) - 1,
                                        },
                                        [currentLoad]: {
                                            $set: (state.warehouse[currentLoad] ?? 0) + 1,
                                        },
                                    },
                                    reactor: { load: { $set: Number(ware) } },
                                }));
                            }
                        }}
                        disabled={count < 1}
                    >Put in reactor as load</button>
                    <button
                        onClick={() => {
                            const currentRule = state.reactor.rule;
                            if (currentRule === undefined) {
                                setState(update(state, {
                                    warehouse: {
                                        [ware]: {
                                            $set: (state.warehouse[ware] ?? 0) - 1,
                                        },
                                    },
                                    reactor: { rule: { $set: Number(ware) } },
                                }));
                            } else {
                                setState(update(state, {
                                    warehouse: {
                                        [ware]: {
                                            $set: (state.warehouse[ware] ?? 0) - 1,
                                        },
                                        [currentRule]: {
                                            $set: (state.warehouse[currentRule] ?? 0) + 1,
                                        },
                                    },
                                    reactor: { rule: { $set: Number(ware) } },
                                }));
                            }
                        }}
                        disabled={count < 1}
                    >Put in reactor as rule</button>
                </div>)}
            </div>
            <div>
                Market:
                {Object.entries(state.market).map(([ware, price], i) => <div key={i}>
                    <button
                        onClick={() => setState(update(state, {
                            energy: { $set: state.energy - price },
                            warehouse: { [ware]: { $set: (state.warehouse[ware] ?? 0) + 1 * Math.sign(price) } },
                        }))}
                        disabled={
                            price > 0
                                ? state.energy < price
                                : (state.warehouse[ware] ?? 0) < 1
                        }
                    >
                        {price > 0 ? "+Buy" : "-Sell"}
                        &nbsp;"{ware}" for {price}
                    </button>
                </div>)}
            </div>
            <div>
                Reactor:
                load: {state.reactor.load?.toString(2).padStart(8, "0")}
                &nbsp;({state.reactor.load})
                {state.reactor.load !== undefined
                    && <button
                        onClick={() => setState(update(state, {
                            warehouse: {
                                [state.reactor.load!]: {
                                    $set: (state.warehouse[state.reactor.load!] ?? 0) + 1,
                                },
                            },
                            reactor: { load: { $set: undefined } },
                        }))}
                    >Unload</button>}
                / rule: {state.reactor.rule?.toString(2).padStart(8, "0")}
                &nbsp;({state.reactor.rule})
                {state.reactor.rule !== undefined
                    && <button
                        onClick={() => setState(update(state, {
                            warehouse: {
                                [state.reactor.rule!]: {
                                    $set: (state.warehouse[state.reactor.rule!] ?? 0) + 1,
                                },
                            },
                            reactor: { rule: { $set: undefined } },
                        }))}
                    >Unload</button>}
                {state.reactor.load !== undefined
                    && state.reactor.rule !== undefined
                    && Array.from({ length: 100 }).map((_, i) => {
                        const { load, rule } = state.reactor;
                        const table = rule!.toString(2).padStart(8, "0").split("").map(Number).reverse();
                        let prevSpace = [] as number[];
                        let space = load.toString(2).padStart(8, "0").split("").map(Number);
                        for (let t = 0; t < i; t++) {
                            prevSpace = space;
                            space = space.map((_, i) => {
                                const left = prevSpace.at(i - 1)!;
                                const right = prevSpace.at(i - 8 + 1)!;
                                const center = prevSpace[i];
                                const ruleIndex = left * 4 + center * 2 + right;
                                return table[ruleIndex];
                            });
                        }
                        const spaceNum = parseInt(space.join(""), 2);
                        return <div key={i}>
                            <button
                                onClick={() => setState(update(state, {
                                    energy: { $set: state.energy - i },
                                    reactor: { load: { $set: spaceNum } },
                                }))}
                                disabled={state.energy < i}
                            >
                                React to {space} ({spaceNum}) for {i} energy
                            </button>
                        </div>;
                    })}
            </div>
        </div >
    );
}