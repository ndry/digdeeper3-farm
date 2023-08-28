import { ReactionSeed } from "./perform-reactor-tick";


export type ReactionCard = {
    reactionSeed: ReactionSeed;
    priority: number;
    isPaused: boolean;
    isTrashed: boolean;
    t: number;
    repeatAt: number | undefined;
};
