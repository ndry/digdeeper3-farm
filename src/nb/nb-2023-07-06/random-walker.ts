import { ReadonlyDeep } from "../../utils/readonly-deep";
import { directionVec } from "./run";


const possibleDirections = [0, 0, 0, 0] as (0 | 1 | 2 | 3)[];
export const getRandomWalkerStep = ({
    stateCount,
    playerPositionX: px,
    playerPositionT: pt,
    atWithBounds,
    random32,
}: ReadonlyDeep<{
    stateCount: number;
    playerPositionX: number;
    playerPositionT: number;
    atWithBounds: (t: number, x: number) => number;
    random32: () => number;
}>) => {
    possibleDirections.length = 0;
    for (let _d = 0; _d < 4; _d++) {
        const d = _d as 0 | 1 | 2 | 3;
        const nx = px + directionVec[d][0];
        const nt = pt + directionVec[d][1];
        const s = atWithBounds(nt, nx);
        if (s === stateCount + 1) { continue; } // bounds
        if (s === 1) { continue; } // wall

        // visited | empty | energy
        possibleDirections.push(d);
    }

    if (possibleDirections.length === 0) {
        throw new Error("Game over: No possible directions");
    }

    const direction =
        possibleDirections[random32() % possibleDirections.length];
    return direction;
};
