/**
 * Full Combined State is a full state of the target neighborhood, expressed
 * as a single integer in a range of [0, stateCount ** neighborhoodSize).
 * Neighborhood size is 4 in this case.
 */
export const getFullCombinedState =
    (stateCount: number, n1: number, c: number, n2: number, pc: number) =>
        n1 + stateCount * (c + stateCount * (n2 + stateCount * pc));
