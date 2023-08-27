import { atom } from "recoil";
import { ReactionSeed } from "./model/perform-reactor-tick";

export const reactionsRecoil = atom({
    key: "reactions",
    default: [] as Array<{
        reactionSeed: ReactionSeed;
        priority: number;
        isPaused: boolean;
        isTrashed: boolean;
        t: number;
        repeatAt: number | undefined;
    }>,
});
