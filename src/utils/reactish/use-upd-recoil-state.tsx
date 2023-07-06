import update, { Spec } from "immutability-helper";
import { useSetRecoilState } from "recoil";


export function useUpdRecoilState<T>(
    ...useSetRecoilStateArgs: Parameters<typeof useSetRecoilState<T>>
) {
    const setState = useSetRecoilState(...useSetRecoilStateArgs);
    return (spec: Spec<T>) => setState(state => update(state, spec));
}
