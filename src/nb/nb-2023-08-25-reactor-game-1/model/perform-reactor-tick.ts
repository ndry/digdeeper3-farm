import { Rule, parseTable } from "../../../ca237v1/rule-io";
import { fillPrestartedSpacetime81UsingCyclicBorders } from "./fill-prestarted-spacetime81-using-cyclic-borders";
import { findRepeat } from "./find-repeat";
import { prepareSpacetime81 } from "./prepare-spacetime81";
import { _never } from "../../../utils/_never";
import { selectByWeight } from "../../../utils/select-by-weight";
import update from "immutability-helper";

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
const getMutableState = (key: string) => {
    if (!mutableStorage.has(key)) { mutableStorage.set(key, new Map()); }
    return mutableStorage.get(key) ?? _never();
};

export const performReactorTick = (state: {
    mutableStorageKey: string,
    reactionPool: Array<{
        reactionSeed: ReactionSeed,
        t: number,
        priority: number,
    }>,
    reactionMultistepSize: number,
    reactionMultistepsPerTick: number,
    reactionRepeatSearchWindow: number,
    output: Array<{
        reactionSeed: ReactionSeed,
        t: number,
        repeatAt: number,
    }>,
}) => {
    const random01 = Math.random;
    const {
        mutableStorageKey,
        reactionPool,
        reactionMultistepSize,
        reactionMultistepsPerTick,
        reactionRepeatSearchWindow,
    } = state;

    const selectedReaction = selectByWeight(
        reactionPool, ({ priority }) => priority, random01());

    const mutableState = getMutableState(mutableStorageKey);
    let reactionState = mutableState.get(selectedReaction.reactionSeed);

    if (!reactionState) {
        mutableState.set(
            selectedReaction.reactionSeed,
            reactionState = {
                table: new Uint8Array(
                    parseTable(selectedReaction.reactionSeed.rule)),
                t: 2,
                spacetime: new Uint8Array([
                    ...parseTable(selectedReaction.reactionSeed.reagent0),
                    ...parseTable(selectedReaction.reactionSeed.reagent1),
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
        const repeatAt =
            reactionState.t - reactionMultistepSize + repeatAtRel;
        state = update(state, {
            output: {
                $push: [{
                    reactionSeed: selectedReaction.reactionSeed,
                    t: reactionState.t,
                    repeatAt,
                }],
            },
            reactionPool: {
                $splice: [[
                    reactionPool.indexOf(selectedReaction), 1,
                ]],
            },
        });
    } else {
        state = update(state, {
            reactionPool: {
                [reactionPool.indexOf(selectedReaction)]: {
                    t: { $set: reactionState.t },
                },
            },
        });
    }

    return state;
};
export type ReactorState = ReturnType<typeof performReactorTick>;
