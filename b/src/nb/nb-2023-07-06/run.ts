import { parseFullTransitionLookupTable } from "../../ca";
import { Code } from "../../ca/code";
import { fillSpace } from "../../ca/fill-space";
import { _never } from "../../utils/_never";
import { LehmerPrng, createLehmer32 } from "../../utils/lehmer-prng";
import { tuple } from "../../utils/tuple";

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


/**
 * A single run of a single agent in a single zone
 */
export const run = ({
    seed,
    spacetimeSeed,
    tickSeed,
    spaceSize,
    code,
    startFillState,
    depthLeftBehind,
    stateMap,
}: {
    seed: number,
    spacetimeSeed: number,
    tickSeed: number,
    spaceSize: number,
    code: Code,
    startFillState: number,
    depthLeftBehind: number,
    stateMap: [number, number, number],
}) => {
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

    const tick = () => {
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
        direction = possibleDirections[tickRandom.next() % possibleDirections.length];


        playerPosition[0] += directionVec[direction][0];
        playerPosition[1] += directionVec[direction][1];
        const s = at(playerPosition[1], playerPosition[0]);
        if (s === 2) { playerEnergy++; }
        if (s === 1) { playerEnergy -= 9; }
        evaluateSpacetime(playerPosition[1] + 3) // ensure next slice before altering current
        spacetime[playerPosition[1]][playerPosition[0]] = stateCount;
        if (playerPosition[1] >= maxDepth) {
            maxDepth = playerPosition[1];
            depth = Math.max(0, maxDepth - depthLeftBehind);
            speed = maxDepth / tickCount;
        }

        return true;
    };

    return {
        get playerEnergy() { return playerEnergy; },
        get depth() { return depth; },
        get maxDepth() { return maxDepth; },
        get playerPositionX() { return playerPosition[0]; },
        get playerPositionT() { return playerPosition[1]; },
        get tickCount() { return tickCount; },
        get speed() { return speed; },
        tick,
        at,
    };
};