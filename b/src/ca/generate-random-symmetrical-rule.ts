import { getNumberFromDigits } from "./digits";
import { buildFullTransitionLookupTable, version } from ".";


export const generateRandomSymmetricalRule = (
    stateCount: number,
    random = Math.random,
) => {
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


    const symTable = Array.from(
        { length: ruleSpaceSizePower },
        () => Math.floor(random() * stateCount));

    const fullTable = buildFullTransitionLookupTable(
        stateCount,
        (_, n1, c, n2, pc) => symTable[
            (c * symStateCount + symmetryMap[n1][n2]) * stateCount + pc]);

    return {
        v: version,
        stateCount,
        rule: getNumberFromDigits(fullTable, stateCount).toString(),
    };
};