import { v2 } from "./utils/v";
import { _never } from "./utils/_never";


const instructionCount = 4; // 4 move directions


export const windowLengths = [6, 5, 4, 3];
export const neighborhoods = [[
    [-2, 0],
    [-1, -1], [-1, 0], [-1, 1],
    [0, -2], [0, -1], [0, 0], [0, 1], [0, 2],
    [1, -1], [1, 0], [1, 1],
    [2, 0],
], [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1], [0, 0], [0, 1],
    [1, -1], [1, 0], [1, 1],
], [
    [-1, 0],
    [0, -1], [0, 0], [0, 1],
    [1, 0],
]] as v2[][];

type LeafMap = Record<
    string, // reduced state
    [number, number, number, number] // action weights
>;
export type AccumulatedMap = LeafMap[];

export const getLeafIndex = (
    windowLengthIndex: number,
    neighborhoodIndex: number,
) => {
    return windowLengthIndex * neighborhoods.length
        + neighborhoodIndex;
};

const getReducedNeighborhoodState = (
    stateCount: number,
    playerPosition: v2,
    /** Should return stateCount + 1 for out of bounds */
    atWithBounds: (t: number, x: number) => number,
    neighborhood: v2[],
) => {
    const sc = stateCount + 1; // for out of bounds
    let s = 0;
    for (let i = 0; i < neighborhood.length; i++) {
        const [px, pt] = playerPosition;
        const [dx, dt] = neighborhood[i];
        s = s * sc + atWithBounds(pt + dt, px + dx);
    }
    return s;
};

/**
 * @mutates states
 * @mutates map
 */
export const processStep = (
    states: number[],
    map: LeafMap,
    stateCount: number,
    playerPosition: v2,
    /** Should return stateCount + 1 for out of bounds */
    atWithBounds: (t: number, x: number) => number,
    windowLength: number,
    neighborhood: v2[],
    instruction: 0 | 1 | 2 | 3, // move direction 
) => {
    const rns = getReducedNeighborhoodState(
        stateCount, playerPosition, atWithBounds, neighborhood);
    states.push(rns * instructionCount + instruction);
    states.splice(0, states.length - windowLength);

    if (states.length >= windowLength) {
        const key = JSON.stringify(states);
        const mapActions = map[key] ?? (map[key] = [0, 0, 0, 0]);
        mapActions[0] *= 0.95;
        mapActions[1] *= 0.95;
        mapActions[2] *= 0.95;
        mapActions[3] *= 0.95;
        mapActions[instruction] += 1;
    }
}


// function mergeX(
//     a: [number, number, number, number] | undefined,
//     b: [number, number, number, number] | undefined,
// ) {
//     if (!a) { return b; }
//     if (!b) { return a; }
//     const sum = b[0] + b[1] + b[2] + b[3];
//     const f = Math.pow(0.95, sum);
//     return [
//         a[0] * f + b[0],
//         a[1] * f + b[1],
//         a[2] * f + b[2],
//         a[3] * f + b[3],
//     ] as [number, number, number, number];
// }

/**
 * @pure
 */
export const offer = (
    states: number[][],
    map: AccumulatedMap,
) => {
    for (let ni = 0; ni < neighborhoods.length; ni++) {
        for (let wi = 0; wi < windowLengths.length; wi++) {
            const li = getLeafIndex(wi, ni);
            const key = JSON.stringify(states[li].slice(-windowLengths[wi]));
            const value = map[li][key];
            if (value) { return value; }
        }
    }
};