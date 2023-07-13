
export const sortedSliceNaive = <T,>(
    arr: Iterable<T>,
    comrareFn: (a: T, b: T) => number,
    start?: number,
    end?: number,
) => [...arr].sort(comrareFn).slice(start, end);

export const sortedSlice = sortedSliceNaive;