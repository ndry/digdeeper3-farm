import { v2, v3 } from "./v";

export const inc = (dx = 1) => (x: number) => x + dx;
export const dec = (dx = 1) => inc(-dx);
export const v2_add = (a: v2) => (b: v2) =>
    v2.lenSq(b) === 0
        ? a
        : v2.add(a, b);
export const v3_add = (a: v3) => (b: v3) =>
    v3.lenSq(b) === 0
        ? a
        : v3.add(a, b);
