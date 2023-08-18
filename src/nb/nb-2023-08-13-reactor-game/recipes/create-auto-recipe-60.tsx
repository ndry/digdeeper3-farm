import { Rule, parseTable } from "../../../ca237v1/rule-io";
import { rrr } from "../run-reactor";
import { sSum } from "../hypothetical-substances";
import { createShiftSingleOneRightSubstance } from "./create-shift-single-one-right-substance";
import { createSingleOneAt60Substance } from "./create-single-one-at-60-substance";


export function createAutoRecipe60(
    log: Parameters<typeof rrr>[0],
    from: Rule,
    to: Rule
) {
    const targetTable = parseTable(to);

    const sShiftRight = createShiftSingleOneRightSubstance(log);

    let sOne = createSingleOneAt60Substance(log);
    let sCurrent = from;
    for (let _i = 0; _i < targetTable.length; _i++) {
        const i = (_i + 60) % targetTable.length;
        if (parseTable(sCurrent)[i] !== targetTable[i]) {
            sCurrent = rrr(log, sSum, sCurrent, sOne, 1);
        }
        if (parseTable(sCurrent)[i] !== targetTable[i]) {
            sCurrent = rrr(log, sSum, sCurrent, sOne, 1);
        }

        sOne = rrr(log, sShiftRight, sOne, sOne, 1);
    }

    return log;
}
