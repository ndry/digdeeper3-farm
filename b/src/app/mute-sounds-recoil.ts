import { atom } from "recoil";
import { localStorageAtomEffect } from "../utils/reactish/local-storage-atom-effect";
import { Howler } from "howler";

export const muteSoundsRecoil = atom({
    key: "muteSounds",
    default: false,
    effects: [
        localStorageAtomEffect(),
        ({ onSet, getInfo_UNSTABLE, node }) => {
            Howler.mute(getInfo_UNSTABLE(node).loadable?.getValue() ?? false);
            onSet((optOut) => Howler.mute(optOut));
        },
    ],
});