import { atom, useSetRecoilState } from "recoil";
import { _never } from "../../../utils/_never";
import update from "immutability-helper";
import { ca237v1FromSeed } from "../../nb-2023-08-13-reactor-game/ca237v1-from-seed";
import { HmacSHA256 } from "crypto-js";
import { ReactionCard } from "../model/reaction-card";

const generateReactionSeed = (i: number) => ({
    rule: ca237v1FromSeed(HmacSHA256(`${i}_rule`, "the-seed")),
    reagent0: ca237v1FromSeed(HmacSHA256(`${i}_reagent0`, "the-seed")),
    reagent1: ca237v1FromSeed(HmacSHA256(`${i}_reagent1`, "the-seed")),
});

const gererateReactionCards = (count: number) => (reactions: ReactionCard[]) =>
    update(reactions, {
        $push: Array.from({ length: count }, (_, i) => ({
            reactionSeed: generateReactionSeed(reactions.length + i),
            priority: 1,
            isPaused: false,
            isTrashed: false,
            t: 2,
            repeatAt: undefined,
        })),
    });


export const reactionsRecoil = atom({
    key: "reactions",
    default: gererateReactionCards(3)([]),
});

export const useGenerateReactionSeeds = () => {
    const setReactions = useSetRecoilState(reactionsRecoil);
    return (count: number) => setReactions(gererateReactionCards(count));
};
