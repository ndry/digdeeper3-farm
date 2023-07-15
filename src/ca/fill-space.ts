import { getFullCombinedState } from ".";


export function fillSpace(
    stateCount: number,
    prevPrevSpace: Readonly<Record<number, number>>,
    prevSpace: Readonly<Record<number, number>>,
    outSpace: Record<number, number> & { length: number },
    fullTransitionLookupTable: Readonly<Record<number, number>>,
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
