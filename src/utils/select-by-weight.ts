import { _never } from "./_never";


export const selectByWeight = <T>(
    pool: readonly T[],
    weightFn: (x: T) => number,
    t01: number,
) => {
    const weightSum = pool.reduce((sum, x) => sum + weightFn(x), 0);
    let w = t01 * weightSum;
    return pool.find((x) => (w -= weightFn(x), w <= 0)) ?? _never();
};
