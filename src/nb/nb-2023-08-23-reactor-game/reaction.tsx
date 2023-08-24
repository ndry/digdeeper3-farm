import { getFullCombinedState } from "../../ca237v1/get-full-combined-state";
import { Rule, parseTable } from "../../ca237v1/rule-io";
import { stateCount } from "../../ca237v1/state-count";


export type Reaction = {
    rule: Rule; reagent1: Rule; reagent2: Rule; t: number;
};

export function generateReactionSpacetime(reaction: Reaction) {
    const { rule, reagent1, reagent2, t } = reaction;
    const table = parseTable(rule);
    const spacetime = [
        parseTable(reagent1),
        parseTable(reagent2),
    ];
    const t1 = t + 2;
    while (spacetime.length < t1) {
        const prevPrev = spacetime[spacetime.length - 2];
        const prev = spacetime[spacetime.length - 1];
        spacetime.push(Array.from({ length: 81 }, (_, i) => {
            return table[getFullCombinedState(
                stateCount,
                prev.at(i - 1)!,
                prev[i],
                prev.at(i - 81 + 1)!,
                prevPrev[i])];
        }));
    }

    return spacetime;
}