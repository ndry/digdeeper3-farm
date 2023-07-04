import { useEffect } from "react";
import { useThree } from "@react-three/fiber";

export function FrameLimiter({ fps }: { fps: number }) {
    const invalidate = useThree(({ invalidate }) => invalidate);

    useEffect(() => {
        let t0 = -Infinity;
        const update = (t: number) => {
            h = requestAnimationFrame(update);
            if (t - t0 < 1000 / fps) { return; }
            invalidate();
            t0 = t;
        };
        let h = requestAnimationFrame(update);
        return () => { cancelAnimationFrame(h); };
    }, [fps, invalidate]);

    return null;
}
