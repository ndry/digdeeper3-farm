import { Rule, parseTable } from "../../../ca237v1/rule-io";
import { sLeftOne, sShiftRight, sSum } from "../hypothetical-substances";
import { rrr } from "../run-reactor";


export function createAutoRecipe(from: Rule, to: Rule) {
    const targetTable = parseTable(to);

    const log = [] as Parameters<typeof rrr>[0];

    let sOne = sLeftOne;
    let sCurrent = from;
    for (let i = 0; i < targetTable.length; i++) {
        if (parseTable(sCurrent)[i] !== targetTable[i]) {
            sCurrent = rrr(log, sSum, sCurrent, sOne, 1);
        }
        if (parseTable(sCurrent)[i] !== targetTable[i]) {
            sCurrent = rrr(log, sSum, sCurrent, sOne, 1);
        }

        let shift = 1;
        while (i < targetTable.length
            && parseTable(sCurrent)[i + 1] === targetTable[i + 1]) {
            i++;
            shift++;
        }
        if (i < targetTable.length) {
            sOne = rrr(log, sShiftRight, sOne, sOne, shift);
        }
    }

    return log;
}
