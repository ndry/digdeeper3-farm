import { parseFullTransitionLookupTable } from "../../ca";
import { Code } from "../../ca/code";
import { fillSpace } from "../../ca/fill-space";
import { _never } from "../../utils/_never";
import { LehmerPrng, createLehmer32 } from "../../utils/lehmer-prng";
import { ReadonlyDeep } from "../../utils/readonly-deep";
import { tuple } from "../../utils/tuple";
import { v2 } from "../../utils/v";
import * as tf from "@tensorflow/tfjs";

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

export const neighborhoodRadius = 8;
export const neighborhood = [...(function* () {
    const r = neighborhoodRadius;
    for (let dt = -r; dt <= r; dt++) {
        for (let dx = -r; dx <= r; dx++) {
            if (Math.abs(dt) + Math.abs(dx) <= r) {
                yield [dt, dx] as v2;
            }
        }
    }
})()];
export const windowLength = 1;

/**
 * A single run of a single agent in a single zone
 */
export const run = (args: ReadonlyDeep<{
    dropzone: Dropzone,
    tickSeed: number,
    copilotModel: {
        id: string,
        model: tf.Sequential,
    } | undefined,
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
    } = args;
    const { stateCount } = code;
    const table = parseFullTransitionLookupTable(code);
    const spacetimeRandom32 = createLehmer32(spacetimeSeed);
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
    let playerEnergy = 3;
    let maxDepth = 0;
    let tickCount = 0;
    let depth = 0;
    let speed = 0;
    const tickRandom = new LehmerPrng(tickSeed);

    let stats: ReturnType<typeof createStats> | undefined = undefined;
    const possibleDirections = [0, 0, 0, 0] as (0 | 1 | 2 | 3)[];
    const tick = () => {
        stats = undefined;
        tickCount++;

        possibleDirections.length = 0;
        for (let _d = 0; _d < 4; _d++) {
            const d = _d as 0 | 1 | 2 | 3;
            const nx = playerPositionX + directionVec[d][0];
            const nt = playerPositionT + directionVec[d][1];
            if (nt < depth) { continue; }
            if (nx < 0 || nx >= spaceSize) { continue; }
            const s = at(nt, nx);
            if (s === 1) { continue; } // wall

            // visited | empty | energy
            possibleDirections.push(d);
        }

        if (possibleDirections.length === 0) {
            console.log("Game over: No possible directions");
            return false;
        }


        let direction: 0 | 1 | 2 | 3 | undefined = undefined;

        if (copilotModel) {
            const t = copilotModel.model.predict([
                tf.tensor([getState()]),
            ]) as tf.Tensor;
            const theOffer = [...t.dataSync()];
            // console.log({ theOffer });

            const sorted = theOffer
                .map((v, i) => [i as 0 | 1 | 2 | 3, v] as const)
                .filter(([i]) => possibleDirections.includes(i))
                .sort((a, b) => b[1] - a[1]);
            for (const [i, v] of sorted) {
                // if (v < 0.5) { break; }
                // const p = 1 - (1 - v) ** 2;
                const p = v;
                if (tickRandom.nextFloat() < p) {
                    direction = i;
                    break;
                }
            }
            if (direction === undefined) {
                direction = possibleDirections[tickRandom.next() % possibleDirections.length];
            }
        } else {
            direction = possibleDirections[tickRandom.next() % possibleDirections.length];
        }

        playerPositionX += directionVec[direction][0];
        playerPositionT += directionVec[direction][1];
        const s = at(playerPositionT, playerPositionX);
        if (s === 2) { playerEnergy++; }
        if (s === 1) { playerEnergy -= 9; }
        evaluateSpacetime(playerPositionT + 3) // ensure next slice before altering current
        spacetime[playerPositionT][playerPositionX] = stateCount;
        if (playerPositionT > maxDepth) {
            maxDepth = playerPositionT;
            depth = Math.max(0, maxDepth - depthLeftBehind);
            speed = maxDepth / tickCount;
        }

        return direction;
    };
    const getState = () => [
        ...neighborhood
            .map(([dx, dt]) => {
                const st = atWithBounds(playerPositionT + dt, playerPositionX + dx);
                return ((st === 0) || (st === 2)) ? 0 : 1;
            }),
        // playerEnergy,
    ];
    const tick1 = () => {
        const state = getState();
        const direction = tick();
        if (direction === false) { return; }
        return { state, direction };
    };
    const createStats = () => ({
        playerEnergy,
        depth,
        maxDepth,
        playerPositionX,
        playerPositionT,
        tickCount,
        speed,
    } as const);


    return {
        get stats() { return stats ??= createStats(); },
        get args() { return args; },
        tick,
        tick1,
        getState,
        get tickCount() { return tickCount; },
        at,
    };
};