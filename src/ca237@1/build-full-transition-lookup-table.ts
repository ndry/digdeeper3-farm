import { getFullCombinedState } from "./get-full-combined-state";

/**
 * Given a getState function,
 * builds a full transition lookup table for all possible neighborhood states.
 */
export function buildFullTransitionLookupTable(
    stateCount: number,
    getState: typeof getFullCombinedState,
) {
    const table: number[] = Array.from({ length: stateCount ** 4 });

    for (let n1 = 0; n1 < stateCount; n1++) {
        for (let c = 0; c < stateCount; c++) {
            for (let n2 = 0; n2 < stateCount; n2++) {
                for (let pc = 0; pc < stateCount; pc++) {
                    table[getFullCombinedState(stateCount, n1, c, n2, pc)] =
                        getState(stateCount, n1, c, n2, pc);
                }
            }
        }
    }

    return table;
}
