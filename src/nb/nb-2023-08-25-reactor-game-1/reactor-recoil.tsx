import { atom } from "recoil";
import { ReactorState } from "./model/perform-reactor-tick";

export const reactorRecoil = atom<ReactorState>({
    key: "reactor",
    default: {
        mutableStorageKey: "dk3ic2",
        reactionPool: [],
        reactionMultistepSize: 1500,
        reactionMultistepsPerTick: 10,
        reactionRepeatSearchWindow: 1500,
        output: [],
    },
});
