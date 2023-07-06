import { AtomEffect } from "recoil";

export function localStorageAtomEffect<T>({ 
    key, 
    select = JSON.stringify,
    unselect = JSON.parse,
}: {
    key?: string | ((key: string) => string);
    select?: (x: T) => string,
    unselect?: (s: string) => T,
} = {}) {
    return ({ node, setSelf, onSet }: Parameters<AtomEffect<T>>[0]) => {
        const keyStr = key === undefined ? node.key
            : (typeof key === "string"
                ? key
                : key(node.key));
        const savedValue = localStorage.getItem(keyStr);
        if (savedValue != null) {
            setSelf(unselect(savedValue));
        }

        onSet((newValue, _, isReset) => {
            if (isReset) {
                localStorage.removeItem(keyStr);
            } else {
                localStorage.setItem(keyStr, select(newValue));
            }
        });
    };
}
