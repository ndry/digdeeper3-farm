import { useLayoutEffect, useMemo, useRef } from "react";
import { version as caVersion } from "../../ca/version";
import { createFullCanvasImageData32 } from "../../utils/create-image-data32";
import { createSpacetimeEvaluator } from "../../ca/create-spacetime-evaluator";
import { useControls } from "leva";
import { Code } from "../../ca/code";
import { parseFullTransitionLookupTable } from "../../ca";
import { LehmerPrng, createLehmer32 } from "../../utils/lehmer-prng";
import { fillSpace } from "../../ca/fill-space";
import { _never } from "../../utils/_never";
import { tuple } from "../../utils/tuple";

const code = {
    v: caVersion,
    stateCount: 3,
    rule: "299338136518556439977845337106716710210",
}

export const colorMap = [
    "#8000ff", // empty
    "#000000", // wall
    "#80ff00", // energy
] as const;
export const playerColor = "#ff0000ff";

const stateMap = [0, 1, 2] as const;
const iStateMap = [
    stateMap.indexOf(0),
    stateMap.indexOf(1),
    stateMap.indexOf(2),
];


export const forward = 0;
export const left = 1;
export const right = 2;
export const backward = 3;

export const directionVec = {
    [forward]: [0, 1],
    [left]: [-1, 0],
    [right]: [1, 0],
    [backward]: [0, -1],
};

export const run = ({
    seed,
    spacetimeSeed,
    tickSeed,
    spaceSize,
    code,
    startFillState,
    depthLeftBehind,
}: {
    seed: number,
    spacetimeSeed: number,
    tickSeed: number,
    spaceSize: number,
    code: Code,
    startFillState: number,
    depthLeftBehind: number,
    stateMap: readonly [number, number, number],
}) => {
    const iStateMap = [
        stateMap.indexOf(0),
        stateMap.indexOf(1),
        stateMap.indexOf(2),
    ] as const;
    const { stateCount } = code;
    const table = parseFullTransitionLookupTable(code);
    const spacetimeRandom32 = createLehmer32(spacetimeSeed);

    /**
     * Spacetime is evolved per request
     * and cell are mutable (energy or walls would become empty)
     */
    const spacetime = [
        Array.from({ length: spaceSize },
            () => iStateMap[startFillState]),
        Array.from({ length: spaceSize },
            () => spacetimeRandom32() % stateCount),
        Array.from({ length: spaceSize },
            () => spacetimeRandom32() % stateCount),
    ];

    const evaluateSpacetime = (t: number) => {
        while (t >= spacetime.length) {
            const space = new Array(spacetime[0].length);
            space[0] = spacetimeRandom32() % stateCount;
            space[space.length - 1] = spacetimeRandom32() % stateCount;
            spacetime.push(space);
            fillSpace(
                stateCount,
                spacetime[spacetime.length - 3],
                spacetime[spacetime.length - 2],
                spacetime[spacetime.length - 1],
                table);
        }
    };

    const at = (t: number, x: number) => {
        evaluateSpacetime(t);
        return stateMap[spacetime[t][x]];
    };

    const playerPosition: [number, number] = [
        Math.floor(spaceSize / 2),
        0,
    ];
    let playerEnergy = 3;
    let maxDepth = 0;
    let tickCount = 0;
    let depth = 0;
    const tickRandom = new LehmerPrng(tickSeed);
    const tick = () => {
        tickCount++;
        const possibleDirections = ([forward, left, right, backward] as const)
            .filter(d => {
                const [dx, dt] = directionVec[d];
                const [x, t] = playerPosition;
                const [nx, nt] = tuple(x + dx, t + dt);
                if (nt < depth) { return false; }
                if (nx < 1 || nx >= spaceSize - 1) { return false; }
                const s = at(nt, nx);
                if (s === 0) { return true; } // empty
                if (s === 1) { return false; } // wall
                // if (s === 1) { return playerEnergy >= 9; } // wall
                if (s === 2) { return true; } // energy
                return _never();
            });

        if (possibleDirections.length === 0) {
            console.log("Game over: No possible directions");
            return false;
        }


        let direction: 0 | 1 | 2 | 3 | undefined = undefined;
        direction = possibleDirections[tickRandom.next() % possibleDirections.length];


        playerPosition[0] += directionVec[direction][0];
        playerPosition[1] += directionVec[direction][1];
        const s = at(playerPosition[1], playerPosition[0]);
        if (s === 2) { playerEnergy++; }
        if (s === 1) { playerEnergy -= 9; }
        evaluateSpacetime(playerPosition[1] + 2) // ensure next slice before altering current
        spacetime[playerPosition[1]][playerPosition[0]] = iStateMap[0];
        maxDepth = Math.max(maxDepth, playerPosition[1]);
        depth = Math.max(0, maxDepth - depthLeftBehind);

        return true;
    };

    return {
        get playerEnergy() { return playerEnergy; },
        get depth() { return depth; },
        playerPosition,
        // spacetime,
        tick,
        at,
    };
};


export function Sim({
    i
}: {
    i: number,
}) {
    const {
        seed,
        scale,
        spaceSize,
    } = useControls({
        seed: { value: 4242, min: 1, max: 0xffffffff, step: 1 },
        scale: { value: 3, min: 1, max: 10, step: 1 },
        spaceSize: { value: 91, min: 2, max: 1000, step: 1 },
    });

    // const {
    //     seed,
    //     scale,
    //     spaceSize,
    // } = useControls({
    //     seed: 4242,
    //     scale: 3,
    //     spaceSize: 91,
    // });

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const theRun = useMemo(() => run({
        seed,
        spacetimeSeed: seed + i + 1,
        tickSeed: seed + i + 2,
        spaceSize,
        code,
        startFillState: 0,
        depthLeftBehind: 200,
        stateMap,
    }), [seed, spaceSize, code]);

    useLayoutEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;


        const w = spaceSize;
        const h = 300;
        canvas.width = w;
        canvas.height = h;
        const {
            ctx,
            put,
            setPixel,
        } = createFullCanvasImageData32(canvas);


        let handle: number;
        const render = () => {
            for (let i = 0; i < 10000; i++) {
                theRun.tick();
            }

            canvas.width = w;
            canvas.height = h;
            const d = theRun.depth;
            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    setPixel(x, y, colorMap[theRun.at(y + d, x)]);
                }
            }

            const [px, pt] = theRun.playerPosition;
            for (let dx = -2; dx <= 2; dx++) {
                for (let dy = -2; dy <= 2; dy++) {
                    const x = px + dx;
                    const y = pt - d + dy;
                    if (x < 0 || x >= w || y < 0 || y >= h) { continue; }

                    setPixel(x, y, playerColor);
                }
            }

            canvas.width *= scale;
            canvas.height *= scale;

            put();
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(
                canvas,
                0, 0, canvas.width / scale, canvas.height / scale,
                0, 0, canvas.width, canvas.height);


            handle = requestAnimationFrame(render);
        };
        render();
        return () => cancelAnimationFrame(handle);

    }, [canvasRef.current, seed, scale, theRun]);

    return <div css={{ padding: "2px" }}>
        <canvas ref={canvasRef} />
    </div>;
}

export default function _App() {
    return <div css={{ display: "flex", flexDirection: "row" }}>
        <Sim i={3123} />
        <Sim i={3232} />
        <Sim i={2129} />
        <Sim i={2953} />
    </div>;
}