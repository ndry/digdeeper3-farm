import { Rule, parseTable } from "../../../ca237v1/rule-io";
import { fillPrestartedSpacetime81UsingCyclicBorders } from "./fill-prestarted-spacetime81-using-cyclic-borders";
import { findRepeat } from "./find-repeat";
import { _never } from "../../../utils/_never";
import update from "immutability-helper";
import { ReactionCard } from "./reaction-card";

export type ReactionSeed = {
    rule: Rule,
    reagent0: Rule,
    reagent1: Rule,
}

let spacetime: Uint8Array;

export const performReactorTick = (
    reaction: ReactionCard,
    {
        reactionMultistepSize,
        reactionMultistepsPerTick,
        reactionRepeatSearchWindow,
    }: {
        reactionMultistepSize: number,
        reactionMultistepsPerTick: number,
        reactionRepeatSearchWindow: number,
    },
) => {
    const table = parseTable(reaction.reactionSeed.rule);
    let t = reaction.t;

    if (!spacetime || spacetime.length !== reactionMultistepSize * 81) {
        spacetime = new Uint8Array(reactionMultistepSize * 81);
    }
    spacetime.set(reaction.last281);
    for (let i = 0; i < reactionMultistepsPerTick; i++) {
        if (i > 0) { spacetime.copyWithin(0, spacetime.length - 2 * 81); }
        fillPrestartedSpacetime81UsingCyclicBorders(
            spacetime, table);
    }
    t += reactionMultistepSize * reactionMultistepsPerTick;
    const last281 = spacetime.slice(spacetime.length - 81 * 2);

    const repeatAtRel = findRepeat(
        spacetime,
        reactionMultistepSize - reactionRepeatSearchWindow,
        reactionMultistepSize);
    if (repeatAtRel !== -1) {
        const repeatAt = t - reactionMultistepSize + repeatAtRel;
        const markTRel = Math.max(0, repeatAtRel - 350);
        const markT = t - reactionMultistepSize + markTRel;
        reaction = update(reaction, {
            repeatAt: { $set: repeatAt },
            marks: {
                start: {
                    $set: {
                        t: 2,
                        last281: new Uint8Array([
                            ...parseTable(reaction.reactionSeed.reagent0),
                            ...parseTable(reaction.reactionSeed.reagent1),
                        ]),
                    },
                },
                lastNonRepeat: {
                    $set: {
                        t: reaction.t,
                        last281: reaction.last281,
                    },
                },
                repeat: {
                    $set: {
                        t: markT + 2,
                        last281: spacetime.slice(
                            markTRel * 81,
                            (markTRel + 2) * 81),
                    },
                },
            },
        });
    }

    return update(reaction, {
        t: { $set: t },
        last281: { $set: last281 },
    });
};
