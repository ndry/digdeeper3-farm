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

const start0 = ca237v1FromSeed(SHA256("start0"));
const start1 = ca237v1FromSeed(SHA256("start1"));

const colorMap = [
    cssColorToAbgr("#ff0000"),
    cssColorToAbgr("#00ff00"),
    cssColorToAbgr("#0000ff"),
];


export function createFarmState(seed: string) {
    return {
        seed: seed,
        plantIcrement: 0,
        plants: Array.from({ length: 10 }, () => undefined) as (string | undefined)[],
        plantCap: 10,
        collectedPlants: [] as any[], // CollectedPlantState[]
        money: 1000,
    };
}


const farmRecoil = atom({
    key: "farm",
    default: createFarmState("farmStateSeed"),
});


export const mutablePlantStates = new Map<string, PlantState>();


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
    i,
    renderTrigger,
    ...props
}: jsx.JSX.IntrinsicElements["div"] & {
    i: number,
    renderTrigger: number,
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [farm, setFarm] = useRecoilState(farmRecoil);
    const plant = farm.plants[i] && mutablePlantStates.get(farm.plants[i]!);

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
    }, [renderTrigger, plant]);

    return <div {...props}>
        <button onClick={() => {
            const seed = HmacSHA256("seed." + farm.plantIcrement, farm.seed);
            const rule = ca237v1FromSeed(seed);
            const plant = createPlantState(rule, seed.toString());
            mutablePlantStates.set(rule, plant);
            setFarm(update(farm, {
                plantIcrement: { $set: farm.plantIcrement + 1 },
                plants: {
                    [i]: { $set: rule },
                },
            }));
        }}>plant</button>
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

    const farm = useRecoilValue(farmRecoil);

    useLayoutEffect(() => {
        if (!isRunning) { return; }

        let h: ReturnType<typeof setTimeout> | undefined;
        const tick = () => {
            for (const plant of farm.plants) {
                if (!plant) { continue; }
                const plantState = mutablePlantStates.get(plant)!;
                updatePlantStateInPlace(plantState, 100);
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
            {Array.from({ length: farm.plantCap }, (_, i) => <div key={i}>
                <RuleView i={i} renderTrigger={renderTrigger} />
            </div>)}

        </div >
    );
}