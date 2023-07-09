/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * @returns fn.bind(boundThis, ...args),
 * but keeps the original fn, boundThis and args
 */
export const bind = <T, A extends any[], B extends any[], R>(
    fn: (this: T, ...args: [...A, ...B]) => R, thisArg: T, ...args: A
) => Object.assign(fn.bind(thisArg, ...args), { fn, thisArg, args });
