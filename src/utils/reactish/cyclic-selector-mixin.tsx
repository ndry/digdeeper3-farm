import { MouseEventHandler, Dispatch, SetStateAction } from "react";

const cyclicAt = 
    <T,>(arr: readonly T[], i: number) => 
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        arr.at(i % arr.length)!;

export function cyclicSelectorMixin<T, El>(
    values: readonly T[],
    [value, setValue]: [T, Dispatch<SetStateAction<T>>],
) {
    return {
        onMouseUp: (ev => {
            let i = values.indexOf(value);
            if (ev.button === 2) { i--; }
            else if (ev.button === 1) { i = 0; }
            else { i++; }

            setValue(cyclicAt(values, i));

            ev.preventDefault();
        }) as MouseEventHandler<El>,
        onMouseDown: (ev => ev.preventDefault()) as MouseEventHandler<El>,
        onContextMenu: (ev => ev.preventDefault()) as MouseEventHandler<El>,
    };
}
