import { atom } from "recoil";


export const currentPlayerNameRecoil = atom<string>({
    key: "currentPlayerName",
    default: "whatabout",
});
