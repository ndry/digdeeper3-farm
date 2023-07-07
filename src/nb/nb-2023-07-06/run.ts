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

export const neighborhood = [...(function* () {
    const r = 8;
    for (let dt = -2; dt <= 2; dt++) {
        for (let dx = -2; dx <= 2; dx++) {
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

    const playerPosition: [number, number] = [
        Math.floor(spaceSize / 2),
        0,
    ];
    let playerEnergy = 3;
    let maxDepth = 0;
    let tickCount = 0;
    let depth = 0;
    let speed = 0;
    const tickRandom = new LehmerPrng(tickSeed);

    let stats: ReturnType<typeof createStats> | undefined = undefined;
    const tick = () => {
        stats = undefined;
        tickCount++;
        const possibleDirections = ([forward, left, right, backward] as const)
            .filter(d => {
                const nx = playerPosition[0] + directionVec[d][0];
                const nt = playerPosition[1] + directionVec[d][1];
                if (nt < depth) { return false; }
                if (nx < 1 || nx >= spaceSize - 1) { return false; }
                const s = at(nt, nx);
                if (s === stateCount) { return true; } // visited
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
                if (tickRandom.nextFloat() < v) {
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

        playerPosition[0] += directionVec[direction][0];
        playerPosition[1] += directionVec[direction][1];
        const s = at(playerPosition[1], playerPosition[0]);
        if (s === 2) { playerEnergy++; }
        if (s === 1) { playerEnergy -= 9; }
        evaluateSpacetime(playerPosition[1] + 3) // ensure next slice before altering current
        spacetime[playerPosition[1]][playerPosition[0]] = stateCount;
        if (playerPosition[1] > maxDepth) {
            maxDepth = playerPosition[1];
            depth = Math.max(0, maxDepth - depthLeftBehind);
            speed = maxDepth / tickCount;
        }

        return direction;
    };
    const getState = () => [
        ...neighborhood
            .map(([dx, dt]) => {
                const st = atWithBounds(playerPosition[1] + dt, playerPosition[0] + dx);
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
        playerPositionX: playerPosition[0],
        playerPositionT: playerPosition[1],
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