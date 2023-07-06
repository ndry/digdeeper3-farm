import { useFrame, GroupProps } from "@react-three/fiber";
import { useRef } from "react";
import { Group } from "three";


export function GroupSync({
    onFrame: onFrame, ...props
}: Omit<GroupProps, "ref"> & {
    onFrame?: (
        obj: Group, 
        ...useFrameArgs: Parameters<Parameters<typeof useFrame>[0]>
    ) => void;
}) {
    const ref = useRef<Group>(null);
    useFrame((...args) => ref.current && onFrame?.(ref.current, ...args));
    return <group ref={ref} {...props} />;
}
