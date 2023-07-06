import { DefaultValue, AtomEffect } from "recoil";


export function onChangeAtomEffect<T, U>({
    select, onChange,
}: {
    select: (value: T) => U;
    onChange: (
        newSelected: U,
        oldSelected: U | DefaultValue,
        newValue: T,
        oldValue: T | DefaultValue,
        isReset: boolean,
        atomEffectParam: Parameters<AtomEffect<T>>[0],
    ) => void;
}) {
    return (atomEffectParam: Parameters<AtomEffect<T>>[0]) => {
        atomEffectParam.onSet(async (newValue, oldValue, isReset) => {
            const oldSelected = (oldValue instanceof DefaultValue)
                ? oldValue
                : select(oldValue);
            const newSelected = select(newValue);
            if (newSelected !== oldSelected) {
                onChange(
                    newSelected, oldSelected,
                    newValue, oldValue,
                    isReset,
                    atomEffectParam);
            }
        });
    };
}
