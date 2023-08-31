import { ReactionSeed } from "./reaction-seed";

// todo: move view-specific stuff to view
export type ReactionCard = {
    reactionSeed: ReactionSeed,
    priority: number,
    isPaused: boolean, // todo: move to view
    isTrashed: boolean, // todo: move to viewq
};
