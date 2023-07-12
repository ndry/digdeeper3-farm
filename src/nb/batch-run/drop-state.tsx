import { parseFullTransitionLookupTable } from "../../ca";
import { fillSpace } from "../../ca/fill-space";
import { bind } from "../../utils/bind";
import { createMulberry32 } from "../../utils/mulberry32";
import { ReadonlyDeep } from "../../utils/readonly-deep";
import { getNeuralWalkerSight } from "../nb-2023-07-06/neural-walker";
import { Dropzone, directionVec } from "../nb-2023-07-06/run";

/**
 * A mutable state of a single agent in a single zone
 */
export function createDropState(dropzone: ReadonlyDeep<Dropzone>) {
    const {
        code,
        stateMap,
        spaceSize,
        depthLeftBehind,
        seed: spacetimeSeed,
        startFillState,
    } = dropzone;

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

    const relativeAtWithBounds = (dt: number, dx: number) =>
        atWithBounds(playerPositionT + dt, playerPositionX + dx);

    let playerPositionX = Math.floor(spaceSize / 2);
    let playerPositionT = 0;
    // let playerEnergy = 3;
    let maxDepth = 0;
    let stepCount = 0;
    let depth = 0;
    let speed = 0;

    const step = (direction: 0 | 1 | 2 | 3) => {
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
    const getSight = bind(getNeuralWalkerSight, undefined, {
        get playerPositionX() { return playerPositionX; },
        get playerPositionT() { return playerPositionT; },
        atWithBounds,
    });

    return {
        get dropzone() { return dropzone; },
        get depth() { return depth; },
        get maxDepth() { return maxDepth; },
        get playerPositionX() { return playerPositionX; },
        get playerPositionT() { return playerPositionT; },
        get speed() { return speed; },

        getSight,
        get stepCount() { return stepCount; },
        at,
        atWithBounds,
        relativeAtWithBounds,
        step,
    };
}
