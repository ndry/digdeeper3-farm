import { ReactionSeed } from "./reaction-seed";


export type ReactionOutput = {
    seed: ReactionSeed,
    t: number;
    output: ReactionSeed;
    tags: string[];
};
export const reactionOutputRegistry = {} as Record<ReactionSeed, {
    subscribers: Array<(
        ro: ReactionOutput,
        r: typeof reactionOutputRegistry,
    ) => void>,
    outputs: Array<ReactionOutput>,
}>;
const registerReactionGlobalSubscribers = [] as Array<(
    ro: ReactionOutput,
    r: typeof reactionOutputRegistry,
) => void>;

export const registerReactionOutput = (output: ReactionOutput) => {
    const rg = (reactionOutputRegistry[output.seed] ??= {
        subscribers: [],
        outputs: [],
    });
    let added = false;
    for (let i = 0; i < rg.outputs.length; i++) {
        if (rg.outputs[i].t > output.t) {
            rg.outputs.splice(i, 0, output);
            added = true;
            break;
        }
    }
    if (!added) { rg.outputs.push(output); }
    for (const subscriber of rg.subscribers) {
        subscriber(output, reactionOutputRegistry);
    }
    for (const subscriber of registerReactionGlobalSubscribers) {
        subscriber(output, reactionOutputRegistry);
    }
};

export const subscribeToReactionOutput = (
    seed: ReactionSeed,
    subscriber: (
        ro: ReactionOutput,
        r: typeof reactionOutputRegistry,
    ) => void,
) => {
    const rg = (reactionOutputRegistry[seed] ??= {
        subscribers: [],
        outputs: [],
    });
    rg.subscribers.push(subscriber);
    return () => {
        const i = rg.subscribers.indexOf(subscriber);
        if (i !== -1) { rg.subscribers.splice(i, 1); }
    };
};

export const subscribeToReactionOutputGlobal = (
    subscriber: (
        ro: ReactionOutput,
        r: typeof reactionOutputRegistry,
    ) => void,
) => {
    registerReactionGlobalSubscribers.push(subscriber);
    return () => {
        const i = registerReactionGlobalSubscribers.indexOf(subscriber);
        if (i !== -1) { registerReactionGlobalSubscribers.splice(i, 1); }
    };
};
