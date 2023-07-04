import { useEffect } from "react";

export function useGrabFocusFromBody(ref: React.RefObject<HTMLDivElement>) {
    useEffect(() => {
        const el = ref.current;
        if (!el) { return; }
        const h = setInterval(() => {
            if (document.activeElement !== document.body) { return; }
            el.focus();
        }, 100);
        return () => clearInterval(h);
    });
}
