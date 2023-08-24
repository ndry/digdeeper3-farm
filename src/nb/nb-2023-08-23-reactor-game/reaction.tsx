import { getFullCombinedState } from "../../ca237v1/get-full-combined-state";
import { Rule, keyifyTable, parseTable } from "../../ca237v1/rule-io";
import { stateCount } from "../../ca237v1/state-count";
import { getEnergyDelta } from "./get-energy-delta";


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

export function runReaction(reaction: Reaction) {
    const spacetime = generateReactionSpacetime(reaction);
    let energyTotal = 0;
    const spacetimeExtended = spacetime.map((space, i) => {
        const energyDelta =
            i < 2 ? 0 : getEnergyDelta(space, spacetime[i - 1]);
        energyTotal += energyDelta;
        return {
            space,
            energyDelta,
            energySubtotal: energyTotal,
        };
    });
    return {
        reaction,
        spacetime,
        spacetimeExtended,
        energyTotal,
        products: {
            rule: reaction.rule,
            reagent1: keyifyTable(spacetime[spacetime.length - 2]),
            reagent2: keyifyTable(spacetime[spacetime.length - 1]),
        },
    };
}
export type ReactionRun = ReturnType<typeof runReaction>;