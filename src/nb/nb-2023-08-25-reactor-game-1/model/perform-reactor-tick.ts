import { Rule, parseTable } from "../../../ca237v1/rule-io";
import { fillPrestartedSpacetime81UsingCyclicBorders } from "./fill-prestarted-spacetime81-using-cyclic-borders";
import { findRepeat } from "./find-repeat";
import { prepareSpacetime81 } from "./prepare-spacetime81";
import { _never } from "../../../utils/_never";
import update from "immutability-helper";
import { ReactionCard } from "./reaction-card";

export type ReactionSeed = {
    rule: Rule,
    reagent0: Rule,
    reagent1: Rule,
}

type MutableReactionState = {
    readonly table: Uint8Array,
    t: number,
    spacetime: Uint8Array,
}

const mutableStorage = new Map<
    string,
    Map<ReactionSeed, MutableReactionState>>();
export const getMutableState = (key: string) => {
    if (!mutableStorage.has(key)) { mutableStorage.set(key, new Map()); }
    return mutableStorage.get(key) ?? _never();
};


export const performReactorTick = (
    reaction: ReactionCard,
    {
        mutableStorageKey,
        reactionMultistepSize,
        reactionMultistepsPerTick,
        reactionRepeatSearchWindow,
    }: {
        mutableStorageKey: string,
        reactionMultistepSize: number,
        reactionMultistepsPerTick: number,
        reactionRepeatSearchWindow: number,
    },
) => {
    const mutableState = getMutableState(mutableStorageKey);
    let reactionState = mutableState.get(reaction.reactionSeed);

    if (!reactionState) {
        mutableState.set(
            reaction.reactionSeed,
            reactionState = {
                table: new Uint8Array(
                    parseTable(reaction.reactionSeed.rule)),
                t: 2,
                spacetime: new Uint8Array([
                    ...parseTable(reaction.reactionSeed.reagent0),
                    ...parseTable(reaction.reactionSeed.reagent1),
                ]),
            });
    }

    for (let i = 0; i < reactionMultistepsPerTick; i++) {
        reactionState.spacetime =
            prepareSpacetime81(reactionState.spacetime, reactionMultistepSize);
        fillPrestartedSpacetime81UsingCyclicBorders(
            reactionState.spacetime, reactionState.table);
    }
    reactionState.t += reactionMultistepSize * reactionMultistepsPerTick;


    const repeatAtRel = findRepeat(
        reactionState.spacetime,
        reactionMultistepSize - reactionRepeatSearchWindow,
        reactionMultistepSize);
    if (repeatAtRel !== -1) {
        reaction = update(reaction, {
            repeatAt: {
                $set: reactionState.t - reactionMultistepSize + repeatAtRel,
            },
        });
    }

    return update(reaction, {
        t: { $set: reactionState.t },
    });
};
