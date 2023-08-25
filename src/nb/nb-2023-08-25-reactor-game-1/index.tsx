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

const start0 = ca237v1FromSeed(SHA256("start0"));
const start1 = ca237v1FromSeed(SHA256("start1"));

const colorMap = [
    cssColorToAbgr("#ff0000"),
    cssColorToAbgr("#00ff00"),
    cssColorToAbgr("#0000ff"),
];


export function createPlantState(rule: Rule) {
    const imageData = new ImageData(500, 81);
    const imageData32 = createImageData32(imageData);
    return {
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
    name,
    rule,
    plant,
    ...props
}: jsx.JSX.IntrinsicElements["div"] & {
    name: string,
    rule: Rule,
    plant: PlantState,
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageData = plant.imageData;
    const firstRepeatAt = plant.firstRepeatAt;

    useLayoutEffect(() => {
        const canvasEl = canvasRef.current;
        if (!canvasEl) { return; }
        const ctx = canvasEl.getContext("2d");
        if (!ctx) { return; }
        canvasEl.width = imageData.width;
        canvasEl.height = imageData.height;
        ctx.putImageData(imageData, 0, 0);
    });

    return <div {...props}>
        {name}:
        <LinkCaPreview substance={rule} />
        &nbsp;/&nbsp;
        firstRepeatAt: {firstRepeatAt}
        &nbsp;/&nbsp;
        t: {plant.t}
        <br />
        <canvas
            ref={canvasRef}
        />
    </div>;
}

const runByDefault = new URL(location.href).searchParams.get("run") == "1";

export default function Component() {
    const [renderTrigger, setRenderTrigger] = useState(0);
    const [isRunning, setIsRunning] = useState(runByDefault);

    const rootSeed = "target." + 1;
    const rules = useMemo(
        () => Array.from({ length: 10 }, (_, i) => {
            const seed = rootSeed + "." + i;
            const rule = ca237v1FromSeed(SHA256(seed));
            const plant = createPlantState(rule);
            return {
                rule,
                seed,
                plant,
            };
        }),
        [rootSeed],
    );

    useLayoutEffect(() => {
        if (!isRunning) { return; }

        let h: ReturnType<typeof setTimeout> | undefined;
        const tick = () => {
            for (const { plant } of rules) {
                updatePlantStateInPlace(plant, 10000);
            }
            setRenderTrigger(x => x + 1);
            h = setTimeout(tick, 1000);
        };
        tick();
        return () => { clearTimeout(h); };
    }, [rules, isRunning]);

    const sortedRules = [...rules].sort((a, b) =>
    ((a.plant.firstRepeatAt ?? Infinity)
        - (b.plant.firstRepeatAt ?? Infinity)));

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
            {sortedRules.map((x1, i) => <div>
                <RuleView name={x1.seed} key={i} {...x1} />
            </div>)}
        </div >
    );
}