import { useThree } from "@react-three/fiber";
import { useLayoutEffect } from "react";

export function Invalidator() {
    const invalidationSource = 0; // e.g. useRecoilValue(...);
    const invalidate = useThree(({ invalidate }) => invalidate);
    useLayoutEffect(() => { invalidate(); }, [invalidationSource, invalidate]);
    return null;
}
