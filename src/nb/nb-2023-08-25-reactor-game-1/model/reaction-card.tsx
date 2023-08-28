import { ReactionSeed } from "./perform-reactor-tick";

// todo: move view-specific stuff to view
export type ReactionCard = {
    reactionSeed: ReactionSeed,
    priority: number,
    isPaused: boolean, // todo: move to view
    isTrashed: boolean, // todo: move to view
    t: number,
    last281: Uint8Array,
    repeatAt: number | undefined,
};
