import { version } from "./version";
import { getDigits } from "./digits";
import { Rule as RuleCa237v1, parseTable as parseTableCa237v1 } from "../ca237v1/rule-io";
import { getNumberFromDigits } from "./digits";

export { version };

/**
 * Full Combined State is a full state of the target neighborhood, expressed 
 * as a single integer in a range of [0, stateCount ** neighborhoodSize).
 * Neighborhood size is 4 in this case.
 */
export const getFullCombinedState =
    (stateCount: number, n1: number, c: number, n2: number, pc: number) =>
        n1 + stateCount * (c + stateCount * (n2 + stateCount * pc));

/**
 * Given a getState function, 
 * builds a full transition lookup table for all possible neighborhood states.
 */
export const buildFullTransitionLookupTable = (
    stateCount: number,
    getState: typeof getFullCombinedState,
) => {
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
};

export const parseFullTransitionLookupTable = ({
    stateCount, rule,
}: {
    stateCount: number;
    rule: string; // BigInt base 10
}) => {
    const table = getDigits(BigInt(rule), stateCount);
    while (table.length < stateCount ** 4) { table.push(0); }
    return table;
};

export const fromCa237v1 = (rule: RuleCa237v1) => ({
    v: version,
    stateCount: 3,
    rule: getNumberFromDigits(parseTableCa237v1(rule), 3).toString(),
});