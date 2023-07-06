import { useEffect, DependencyList } from "react";


export function useWindowEvent<K extends keyof WindowEventMap>(
    type: K,
    listener: (this: Window, ev: WindowEventMap[K]) => unknown,
    deps?: DependencyList,
) {
    useEffect(() => {
        window.addEventListener(type, listener);
        return () => window.removeEventListener(type, listener);
    }, deps);
}
