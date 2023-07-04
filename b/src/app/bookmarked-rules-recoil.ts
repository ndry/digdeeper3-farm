import { atom, useRecoilState } from "recoil";
import { Code, eqCode } from "../ca/code";
import { localStorageAtomEffect } from "../utils/reactish/local-storage-atom-effect";
import { tuple } from "../utils/tuple";

export const bookmarkedRulesRecoil = atom({
    key: "bookmarkedRules",
    default: [] as Code[],
    effects: [
        localStorageAtomEffect(),
    ],
});

export function useToggleRuleBookmark(code: Code) {
    const [bookmarkedRules, setBookmarkedRules] =
        useRecoilState(bookmarkedRulesRecoil);
    const isBookmarked = bookmarkedRules.some(c => eqCode(c, code));
    return tuple(
        isBookmarked,
        () =>
            setBookmarkedRules((codes) =>
                isBookmarked
                    ? codes.filter(c => !eqCode(c, code))
                    : [code, ...codes]),
    );
}