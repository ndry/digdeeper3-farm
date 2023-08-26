import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { retroThemeCss } from "../nb-2023-07-06/retro-theme-css";
import { SHA256 } from "crypto-js";
import { jsx } from "@emotion/react";
import { Rule, keyifyTable, parseTable } from "../../ca237v1/rule-io";
import { ca237v1FromSeed } from "../nb-2023-08-13-reactor-game/ca237v1-from-seed";
import { LinkCaPreview } from "../nb-2023-08-13-reactor-game/link-ca-preview";
import { createImageData32, cssColorToAbgr } from "../../utils/create-image-data32";
import { getFullCombinedState } from "../../ca237v1/get-full-combined-state";
import { Reaction } from "../nb-2023-08-23-reactor-game/reaction";
import type * as CryptoJS from "crypto-js";
export type WordArray = CryptoJS.lib.WordArray;
import update from "immutability-helper";
import { StateProp } from "../../utils/reactish/state-prop";
import { atom, useRecoilState, useRecoilValue } from "recoil";
import { HmacSHA256 } from "crypto-js";
import { create } from "lodash";

const start0 = ca237v1FromSeed(SHA256("start0"));
const start1 = ca237v1FromSeed(SHA256("start1"));

const colorMap = [
    cssColorToAbgr("#ff0000"),
    cssColorToAbgr("#00ff00"),
    cssColorToAbgr("#0000ff"),
];

export const mutablePlantStates = new Map<string, PlantState>();

export function createFarmState(seed: string) {
    const plantCap = 5;
    let plantIcrement = 0;
    const plantKeys = Array.from(
        { length: plantCap },
        () => {
            const rule = ca237v1FromSeed(HmacSHA256(
                "seed." + plantIcrement,
                seed));
            mutablePlantStates.set(rule,
                createPlantState(rule, seed.toString()));
            plantIcrement++;
            return rule;
        });
    return {
        seed: seed,
        plantIcrement,
        plantCap,
        plantKeys,
        collectedPlants: [] as any[], // CollectedPlantState[]
        money: 1000,
    };
}


const farmRecoil = atom({
    key: "farm",
    default: createFarmState("farmStateSeed"),
});




export function createPlantState(rule: Rule, name: string) {
    const imageData = new ImageData(1500, 81);
    const imageData32 = createImageData32(imageData);
    return {
        name,
        seed: {
            rule,
            s0: start0,
            s1: start1,
        },
        imageData,
        imageData32,
        t: 2,
        sSet: new Set<Rule>([start0, start1]),
        table: parseTable(rule),
        spacetime: [
            parseTable(start0),
            parseTable(start1),
        ],
        firstRepeatAt: undefined as number | undefined,
    };
}
type PlantState = ReturnType<typeof createPlantState>;

export function updatePlantStateInPlace(state: PlantState, dt: number) {
    if (state.firstRepeatAt !== undefined) { return; }

    const t1 = state.t + dt;
    while (state.t < t1) {
        const prevPrev = state.spacetime[state.spacetime.length - 2];
        const prev = state.spacetime[state.spacetime.length - 1];
        const space = prev.map(() => 0);
        for (let x = 0; x < prev.length; x++) {
            space[x] = state.table[getFullCombinedState(
                3,
                prev[(x - 1 + prev.length) % prev.length],
                prev[x],
                prev[(x + 1) % prev.length],
                prevPrev[x],
            )];
        }

        if (state.firstRepeatAt === undefined) {
            const r = keyifyTable(space);
            if (state.sSet.has(r)) {
                state.firstRepeatAt = state.t;
            } else {
                state.sSet.add(r);
            }
        }
        state.spacetime.push(space);
        while (state.spacetime.length > state.imageData.width) {
            state.spacetime.shift();
        }
        state.t++;
    }

    const t0 = state.t - state.spacetime.length;
    for (let t = 0; t < state.spacetime.length; t++) {
        for (let x = 0; x < state.spacetime[t].length; x++) {
            const color =
                (state.firstRepeatAt !== undefined
                    && t === state.firstRepeatAt - t0 + 1)
                    ? 0
                    : colorMap[state.spacetime[t][x]];
            state.imageData32.setPixelAbgr(t, x, color);
        }
    }
}

export function RuleView({
    plantKey,
    renderTrigger,
    ...props
}: jsx.JSX.IntrinsicElements["div"] & {
    plantKey: string,
    renderTrigger: number,
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const plant = mutablePlantStates.get(plantKey);

    useLayoutEffect(() => {
        if (!plant) { return; }
        const imageData = plant.imageData;

        const canvasEl = canvasRef.current;
        if (!canvasEl) { return; }
        const ctx = canvasEl.getContext("2d");
        if (!ctx) { return; }
        canvasEl.width = imageData.width;
        canvasEl.height = imageData.height;
        ctx.putImageData(imageData, 0, 0);
    }, [renderTrigger, plantKey]);

    return <div {...props}>
        {plant && <>
            {plant.name}:
            <LinkCaPreview substance={plant.seed.rule} />
            &nbsp;/&nbsp;
            firstRepeatAt: {plant.firstRepeatAt}
            &nbsp;/&nbsp;
            t: {plant.t}
            <br />
            <canvas
                ref={canvasRef}
            />
        </>}
    </div>;
}

const runByDefault = new URL(location.href).searchParams.get("run") == "1";

export default function Component() {
    const [renderTrigger, setRenderTrigger] = useState(0);
    const [isRunning, setIsRunning] = useState(runByDefault);

    const [farm, setFarm] = useRecoilState(farmRecoil);

    useLayoutEffect(() => {
        if (!isRunning) { return; }

        let h: ReturnType<typeof setTimeout> | undefined;
        const tick = () => {
            for (const plant of farm.plantKeys) {
                const plantState = mutablePlantStates.get(plant)!;
                updatePlantStateInPlace(plantState, 500);
            }

            // autocollect
            const keysToCollect = farm.plantKeys.filter(plant => {
                const plantState = mutablePlantStates.get(plant)!;
                return plantState.firstRepeatAt !== undefined;
            });
            if (keysToCollect.length > 0) {
                const keysToLeave = farm.plantKeys.filter(plant => {
                    const plantState = mutablePlantStates.get(plant)!;
                    return plantState.firstRepeatAt === undefined;
                });
                let plantIcrement = farm.plantIcrement;
                const moreKeys = Array.from(
                    { length: keysToCollect.length },
                    () => {
                        const seed = HmacSHA256(
                            "seed." + plantIcrement,
                            farm.seed);
                        const rule = ca237v1FromSeed(seed);
                        mutablePlantStates.set(rule,
                            createPlantState(rule, seed.toString()));
                        plantIcrement++;
                        return rule;
                    });

                setFarm(update(farm, {
                    plantIcrement: { $set: plantIcrement },
                    plantKeys: { $set: [...keysToLeave, ...moreKeys] },
                    collectedPlants: { $push: keysToCollect },
                }));
            }

            setRenderTrigger(x => x + 1);
            h = setTimeout(tick, 1000 / 60);
        };
        tick();
        return () => { clearTimeout(h); };
    }, [farm, isRunning]);

    return (
        <div css={[{
            fontSize: "0.71em",
            // display: "flex",
            // flexDirection: "column",
            padding: "1em",
        }, retroThemeCss]}>
            Hello World from {import.meta.url}
            <br />
            <button onClick={() => setIsRunning(x => !x)}>
                {isRunning ? "pause" : "run"}
            </button>
            <br />
            renderTrigger: {renderTrigger}
            <br />
            <button
                onClick={() => {
                    const seed = HmacSHA256(
                        "seed." + farm.plantIcrement,
                        farm.seed);
                    const rule = ca237v1FromSeed(seed);
                    const plant = createPlantState(rule, seed.toString());
                    mutablePlantStates.set(rule, plant);
                    setFarm(update(farm, {
                        plantIcrement: { $set: farm.plantIcrement + 1 },
                        plantKeys: { $push: [rule] },
                    }));
                }}
                disabled={farm.plantKeys.length >= farm.plantCap}
            >plant</button>
            <br />
            <br />
            {farm.plantKeys.map((plantKey, i) => <div key={plantKey}>
                <button onClick={() => {
                    const seed = HmacSHA256(
                        "seed." + farm.plantIcrement,
                        farm.seed);
                    const rule = ca237v1FromSeed(seed);
                    mutablePlantStates.set(rule, createPlantState(rule, seed.toString()));
                    // mutablePlantStates.delete(plant.seed.rule);
                    setFarm(update(farm, {
                        plantIcrement: { $set: farm.plantIcrement + 1 },
                        plantKeys: { $splice: [[i, 1, rule]] },
                        collectedPlants: { $push: [plantKey] },
                    }));
                }}>collect</button>
                &nbsp;
                <button onClick={() => {
                    const seed = HmacSHA256(
                        "seed." + farm.plantIcrement,
                        farm.seed);
                    const rule = ca237v1FromSeed(seed);
                    mutablePlantStates.set(rule, createPlantState(rule, seed.toString()));
                    setFarm(update(farm, {
                        plantIcrement: { $set: farm.plantIcrement + 1 },
                        plantKeys: { $splice: [[i, 1, rule]] },
                    }));
                }}>trash</button>
                <RuleView plantKey={plantKey} renderTrigger={renderTrigger} />
            </div>)}
            <br />
            <br />
            collectedPlants:
            {farm.collectedPlants
                .toSorted((a, b) =>
                    (mutablePlantStates.get(b)?.firstRepeatAt ?? -Infinity)
                    - (mutablePlantStates.get(a)?.firstRepeatAt ?? -Infinity))
                .map(plantKey => <div key={plantKey}>
                    <RuleView plantKey={plantKey} renderTrigger={renderTrigger} />
                </div>)}
        </div >
    );
}