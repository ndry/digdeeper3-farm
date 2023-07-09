import { parseFullTransitionLookupTable } from "../../ca";
import { Code } from "../../ca/code";
import { fillSpace } from "../../ca/fill-space";
import { _never } from "../../utils/_never";
import { createMulberry32 } from "../../utils/mulberry32";
import { ReadonlyDeep } from "../../utils/readonly-deep";
import * as tf from "@tensorflow/tfjs";
import { getNeuralWalkerStep, getNeuralWalkerSight } from "./neural-walker";
import { getRandomWalkerStep } from "./random-walker";
import { bind } from "../../utils/bind";
import { getRecordWalkerStep } from "./record-walker";

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

export type Dropzone = {
    code: Code, // world
    stateMap: [number, number, number], // world
    startFillState: number, // world or zone?
    spaceSize: number,
    seed: number,
    depthLeftBehind: number,// zone or drop?
};


export const x = (
    trek: number[],
) => {
    let i = 0;
    return () => {
        const v = trek[i];
        i++;
        return v;
    };
};

/**
 * A single run of a single agent in a single zone
 */
export const run = (args: Readonly<{
    dropzone: ReadonlyDeep<Dropzone>,
    tickSeed: number,
    copilotModel?: ReadonlyDeep<{
        id: string,
        model: tf.Sequential,
    }>,
    /**
     * If provided, should be initialized with a length.
     * Will be filled each step as long as step < length.
     */
    stepRecorder?: Uint8Array,
    recordedSteps?: Uint8Array, // Readonly<Uint8Array>
}>) => {
    const {
        dropzone: {
            code,
            stateMap,
            spaceSize,
            depthLeftBehind,
            seed: spacetimeSeed,
            startFillState,
        },
        tickSeed,
        copilotModel,
        stepRecorder,
        recordedSteps,
    } = args;
    const { stateCount } = code;
    const table = parseFullTransitionLookupTable(code);
    const spacetimeRandom32 = createMulberry32(spacetimeSeed);
    const iStateMap = [
        stateMap.indexOf(0),
        stateMap.indexOf(1),
        stateMap.indexOf(2),
    ];

    /**
     * Spacetime is evolved per request
     * and cells are mutable (energy or walls would become empty)
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
        const s = spacetime[t][x];
        if (s === stateCount) { return s; } // visited
        return stateMap[spacetime[t][x]];
    };

    const atWithBounds = (t: number, x: number) => {
        if (t < 0) { return stateCount + 1; }
        if (x < 0 || x >= spaceSize) { return stateCount + 1; }
        return at(t, x);
    };

    let playerPositionX = Math.floor(spaceSize / 2);
    let playerPositionT = 0;
    // let playerEnergy = 3;
    let maxDepth = 0;
    let stepCount = 0;
    let depth = 0;
    let speed = 0;

    const getStep =
        recordedSteps
            ? bind(getRecordWalkerStep, undefined, {
                get stepCount() { return stepCount; },
                recordedSteps,
            })
            : copilotModel
                ? bind(getNeuralWalkerStep, undefined, {
                    stateCount,
                    get playerPositionX() { return playerPositionX; },
                    get playerPositionT() { return playerPositionT; },
                    atWithBounds,
                    random32: createMulberry32(tickSeed),
                    model: copilotModel.model,
                })
                : bind(getRandomWalkerStep, undefined, {
                    stateCount,
                    get playerPositionX() { return playerPositionX; },
                    get playerPositionT() { return playerPositionT; },
                    atWithBounds,
                    random32: createMulberry32(tickSeed),
                });

    let stats: ReturnType<typeof createStats> | undefined = undefined;
    const step = (direction: 0 | 1 | 2 | 3) => {
        stats = undefined;
        if (stepRecorder && stepCount < stepRecorder.length) {
            stepRecorder[stepCount] = direction;
        }


        playerPositionX += directionVec[direction][0];
        playerPositionT += directionVec[direction][1];
        // const s = at(playerPositionT, playerPositionX);
        // if (s === 2) { playerEnergy++; }
        // if (s === 1) { playerEnergy -= 9; }

        // ensure next slice before altering current
        evaluateSpacetime(playerPositionT + 3);

        spacetime[playerPositionT][playerPositionX] = stateCount;
        if (playerPositionT > maxDepth) {
            maxDepth = playerPositionT;
            depth = Math.max(0, maxDepth - depthLeftBehind);
            speed = maxDepth / stepCount;
        }

        stepCount++;
    };
    const tick = () => {
        const direction = getStep();
        step(direction);
        return direction;
    };
    const getSight = bind(getNeuralWalkerSight, undefined, {
        get playerPositionX() { return playerPositionX; },
        get playerPositionT() { return playerPositionT; },
        atWithBounds,
    });
    const tick1 = () => {
        const state = getSight();
        const direction = tick();
        return { state, direction };
    };
    const createStats = () => ({
        // playerEnergy,
        depth,
        maxDepth,
        playerPositionX,
        playerPositionT,
        stepCount,
        speed,
    } as const);


    return {
        get stats() { return stats ??= createStats(); },
        get args() { return args; },
        tick,
        tick1,
        getStep,
        getSight,
        get stepCount() { return stepCount; },
        at,
    };
};