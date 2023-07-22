import { keyifyTable, stateCount } from ".";
import { buildFullTransitionLookupTable } from "./build-full-transition-lookup-table";


const symmetryMap = Array.from({ length: stateCount }, () =>
    Array.from({ length: stateCount }),
) as number[][];
let a = 0;
for (let i = 0; i < stateCount; i++) {
    for (let j = 0; j <= i; j++) {
        symmetryMap[i][j] = symmetryMap[j][i] = a++;
    }
}
const symStateCount = symmetryMap[stateCount - 1][stateCount - 1] + 1;
const ruleSpaceSizePower = stateCount ** 2 * symStateCount;


export const generateRandomSymmetricalRule = (random01 = Math.random) => {
    const symTable = Array.from(
        { length: ruleSpaceSizePower },
        () => Math.floor(random01() * stateCount));

    return keyifyTable(
        buildFullTransitionLookupTable(
            stateCount,
            (_, n1, c, n2, pc) => symTable[
                (c * symStateCount + symmetryMap[n1][n2]) * stateCount + pc]));
};