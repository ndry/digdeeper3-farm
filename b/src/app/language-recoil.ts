import { atom, useRecoilValue } from "recoil";
import { localStorageAtomEffect } from "../utils/reactish/local-storage-atom-effect";
import { translation } from "./translation";



const resolveByLanguage = <T>(
    languages: readonly string[],
    translations: Readonly<Record<string, T>>,
) => {
    for (const language of languages) {
        if (language in translations) {
            return translations[language];
        }
    }
    for (const language of languages) {
        const languageShort = language.split("-")[0];
        if (languageShort in translations) {
            return translations[languageShort];
        }
    }
};

export const languageRecoil = atom({
    key: "language",
    default: undefined as string | undefined,
    effects: [
        localStorageAtomEffect(),
    ],
});

export const useResolveByLanguage = () => {
    const selectedLanguage = useRecoilValue(languageRecoil);
    const languages =
        selectedLanguage
            ? [selectedLanguage, ...navigator.languages]
            : navigator.languages;
    return <T>(translations: Readonly<Record<string, T>>) =>
        resolveByLanguage(languages, translations);
};

export const useTranslate = () => {
    const resolveByLanguage = useResolveByLanguage();
    return (term: keyof typeof translation) => {
        if (!(term in translation)) {
            if (import.meta.env.DEV) { return "!!! " + term; }
            return term;
        }
        return resolveByLanguage(translation[term]) ?? term;
    };
};
