import { getFullCombinedState } from ".";


export function fillSpace(
    stateCount: number,
    prevPrevSpace: number[],
    prevSpace: number[],
    outSpace: number[],
    fullTransitionLookupTable: number[],
) {
    const nr = 1;
    for (let x = nr; x < outSpace.length - nr; x++) {
        const cs = getFullCombinedState(
            stateCount,
            prevSpace[x - 1],
            prevSpace[x],
            prevSpace[x + 1],
            prevPrevSpace[x]);
        outSpace[x] = fullTransitionLookupTable[cs];
    }
}
