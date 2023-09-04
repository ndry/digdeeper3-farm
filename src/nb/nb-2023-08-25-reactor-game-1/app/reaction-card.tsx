import { ReactionSeed } from "../model/reaction-seed";

export type ReactionCard = {
    reactionSeed: ReactionSeed,
    priority: number,
    isPaused: boolean,
    isTrashed: boolean,
};
