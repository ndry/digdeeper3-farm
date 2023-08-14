import { Rule, keyifyTable, parseTable } from "../../ca237v1/rule-io";
import { getFullCombinedState } from "../../ca237v1/get-full-combined-state";
import { stateCount } from "../../ca237v1/state-count";

export const runReactor = ({
    rule, reagent1, reagent2, t,
}: {
    rule: Rule; reagent1: Rule; reagent2: Rule; t: number;
}) => {
    const table = parseTable(rule);
    let prevSpace = parseTable(reagent1);
    let space = parseTable(reagent2);
    for (let ti = 0; ti < t; ti++) {
        const nextSpace = space.map((_, x) => table[getFullCombinedState(
            stateCount,
            space.at(x - 1)!,
            space[x],
            space.at(x - space.length + 1)!,
            prevSpace[x])]);
        prevSpace = space;
        space = nextSpace;
    }
    return {
        reagent1: keyifyTable(prevSpace),
        reagent2: keyifyTable(space),
    };
};

export const rr = (rule: Rule, reagent1: Rule, reagent2: Rule, t: number) => ({
    rule, reagent1, reagent2, t,
});

export const rrr = (log: {
    rule: Rule, reagent1: Rule, reagent2: Rule, t: number,
}[], rule: Rule, reagent1: Rule, reagent2: Rule, t: number) => {
    const r = rr(rule, reagent1, reagent2, t);
    log.push(r);
    return runReactor(r).reagent2;
};
