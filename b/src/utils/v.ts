
export type v2 = [number, number];
export type rv2 = readonly [number, number];
export const v2 = {
    from: (x: number, y: number): v2 => [x, y],
    zero: (): v2 => [0, 0],
    ones: (): v2 => [1, 1],
    one: (i: 0 | 1 = 0): v2 => i === 0 ? [1, 0] : [0, 1],

    add: ([ax, ay]: rv2, [bx, by]: rv2): v2 => [ax + bx, ay + by],
    scale: ([ax, ay]: rv2, b: number): v2 => [ax * b, ay * b],
    dot: ([ax, ay]: rv2, [bx, by]: rv2) => ax * bx + ay * by,
    eqStrict: ([ax, ay]: rv2, [bx, by]: rv2) => ax === bx && ay === by,

    negate: ([ax, ay]: rv2): v2 => [-ax, -ay],
    sub: ([ax, ay]: rv2, [bx, by]: rv2): v2 => [ax - bx, ay - by],
    lenSq: ([ax, ay]: rv2) => ax * ax + ay * ay,
    len: ([ax, ay]: rv2) => Math.sqrt(ax * ax + ay * ay),
    norm: ([ax, ay]: rv2): v2 => {
        const iLen = 1 / Math.sqrt(ax * ax + ay * ay);
        return [ax * iLen, ay * iLen];
    },
    distSq: (a: rv2, b: rv2) => v2.lenSq(v2.sub(b, a)),
    dist: (a: rv2, b: rv2) => v2.len(v2.sub(b, a)),
    eq: (a: rv2, b: rv2, eps = 0) => v2.eqStrict(a, b) || v2.dist(a, b) <= eps,

    sumReducer: () => [
        (acc: v2, [x, y]: rv2) => {
            acc[0] += x;
            acc[1] += y;
            return acc;
        },
        v2.zero(),
    ] as const,

    r: {
        zero: [0, 0] as const,
    },
};


type _TupleOf<T, N extends number, R extends unknown[]> = 
    R["length"] extends N 
        ? R 
        : _TupleOf<T, N, [T, ...R]>;
type Tuple<T, N extends number> = 
    N extends N 
        ? number extends N 
            ? T[] 
            : _TupleOf<T, N, []> 
        : never;

export type v<D extends number> = Tuple<number, D>;

export function v<D extends 1 | 2 | 3 | 4 | 5 | 6 | 7>(d: D) {
    type vd = v<D>;
    type rvd = Readonly<vd>;
    const vd = {
        from: (...v: rvd) => [...v] as vd,
        zero: () => Array.from({ length: d }, () => 0) as vd,
        ones: () => Array.from({ length: d }, () => 1) as vd,
        one: (i: number) =>
            Array.from({ length: d }, (_, _i) => Number(i === _i)) as vd,

        add: (a: rvd, b: rvd) => a.map((_, i) => a[i] + b[i]) as vd,
        scale: (a: rvd, b: number) => a.map((_, i) => a[i] * b) as vd,
        dot: (a: rvd, b: rvd) =>
            a.map((_, i) => a[i] * b[i]).reduce((acc, v) => acc + v, 0),
        eqStrict: (a: rvd, b: rvd) => a.every((_, i) => a[i] === b[i]),

        negate: (a: rvd) => vd.scale(a, -1),
        sub: (a: rvd, b: rvd) => vd.add(a, vd.negate(b)),
        lenSq: (v: rvd) => vd.dot(v, v),
        len: (v: rvd) => Math.sqrt(vd.lenSq(v)),
        norm: (v: rvd) => vd.scale(v, 1 / vd.len(v)),
        distSq: (a: rvd, b: rvd) => vd.lenSq(vd.sub(b, a)),
        dist: (a: rvd, b: rvd) => vd.len(vd.sub(b, a)),
        eq: (a: rvd, b: rvd, eps = 0) => vd.dist(a, b) <= eps,

        sumReducer: () => [
            (acc: rvd, v: rvd) => vd.add(acc, v),
            vd.zero(),
        ] as const,
    };
    return vd;
}


export type v3 = v<3>;
export const v3 = v(3);