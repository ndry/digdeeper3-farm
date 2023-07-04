// hax = _H_exagonal _AX_ial
// This lib is mainly based on https://www.redblobgames.com/grids/hexagons/

type v2 = [number, number];
type rv2 = Readonly<v2>;

export const SQRT3 = Math.sqrt(3);
export const toFlatCart = ([q, r]: rv2) => 
    [(SQRT3 / 2) * q, (1 / 2) * q + r] as v2;
export const fromFlatCart = ([x, y]: rv2) => 
    [2 / SQRT3 * x, - 1 / SQRT3 * x + y] as v2;
export const len = (h: rv2) => 
    (Math.abs(q(h)) + Math.abs(r(h)) + Math.abs(s(h))) / 2;
export const q = (h: rv2) => h[0];
export const r = (h: rv2) => h[1];
export const s = (h: rv2) => -q(h) - r(h);
export const rotate60Cw = (h: rv2) => [-r(h), -s(h)] as v2;
export const rotate60Ccw = (h: rv2) => [-s(h), -q(h)] as v2;
export const rotate60CwTimes = (h: rv2, times: number) => {
    times %= 6;
    if (times < 0) times += 6;
    for (let i = 0; i < times; i++) h = rotate60Cw(h);
    return h;
};
export const rotate60CcwTimes = (h: rv2, times: number) => {
    times %= 6;
    if (times < 0) times += 6;
    for (let i = 0; i < times; i++) h = rotate60Ccw(h);
    return h;
};
export const round = (h: rv2): v2 => {
    const _q = Math.round(q(h));
    const _r = Math.round(r(h));
    const _s = Math.round(s(h));

    const q_diff = Math.abs(_q - q(h));
    const r_diff = Math.abs(_r - r(h));
    const s_diff = Math.abs(_s - s(h));

    if (q_diff > r_diff && q_diff > s_diff) return [-_r - _s, _r];
    if (r_diff > s_diff) return [_q, -_q - _s];
    return [_q, _r];
};

const _dir60 = {
    qnr: [1, -1], // = [1, -1, 0],
    qns: [1, 0], // = [1, 0, -1],
    rns: [0, 1], // = [0, 1, -1],
    rnq: [-1, 1], // = [-1, 1, 0], // -qnr
    snq: [-1, 0], // = [-1, 0, 1], // -qns
    snr: [0, -1], // = [0, -1, 1], // -rns
} as const;
const _dirFlat60 = {
    northEast: _dir60.qnr,
    southEast: _dir60.qns,
    south: _dir60.rns,
    southWest: _dir60.rnq,
    northWest: _dir60.snq,
    north: _dir60.snr,
};
const _dirPointy60 = {
    northEast: _dir60.qnr,
    east: _dir60.qns,
    southEast: _dir60.rns,
    southWest: _dir60.rnq,
    west: _dir60.snq,
    northWest: _dir60.snr,
};
export const direction = {
    ..._dir60,
    flat60: {
        ..._dirFlat60,
        ["↗"]: _dirFlat60.northEast,
        ne: _dirFlat60.northEast,
        ["↘"]: _dirFlat60.southEast,
        se: _dirFlat60.southEast,
        ["↓"]: _dirFlat60.south,
        s: _dirFlat60.south,
        ["↙"]: _dirFlat60.southWest,
        sw: _dirFlat60.southWest,
        ["↖"]: _dirFlat60.northWest,
        nw: _dirFlat60.northWest,
        ["↑"]: _dirFlat60.north,
        n: _dirFlat60.north,

        itCw: [
            _dirFlat60.northEast,
            _dirFlat60.southEast,
            _dirFlat60.south,
            _dirFlat60.southWest,
            _dirFlat60.northWest,
            _dirFlat60.north,
        ],

        /**
         * @deprecated Better use itCw without expliicitly known start direction
         */
        itCwFromSouth: [
            _dirFlat60.south,
            _dirFlat60.southWest,
            _dirFlat60.northWest,
            _dirFlat60.north,
            _dirFlat60.northEast,
            _dirFlat60.southEast,
        ],
    },
    pointy: {
        ..._dirPointy60,
        ["↗"]: _dirPointy60.northEast,
        ne: _dirPointy60.northEast,
        ["→"]: _dirPointy60.east,
        e: _dirPointy60.east,
        ["↘"]: _dirPointy60.southEast,
        se: _dirPointy60.southEast,
        ["↙"]: _dirPointy60.southWest,
        sw: _dirPointy60.southWest,
        ["←"]: _dirPointy60.west,
        w: _dirPointy60.west,
        ["↖"]: _dirPointy60.northWest,
        nw: _dirPointy60.northWest,
    },
    itCw60: [
        _dir60.qnr, _dir60.qns, _dir60.rns, 
        _dir60.rnq, _dir60.snq, _dir60.snr,
    ],
} as const;

export function* circle(radius: number) {
    if (radius === 0) {
        yield [0, 0] as v2;
    } else {
        for (let j = 0; j < radius; j++) {
            yield [radius, -j] as v2;
            yield [radius - j, -radius] as v2;
            yield [radius - j - 1, j + 1] as v2;
            yield [-radius, j] as v2;
            yield [-radius + j, radius] as v2;
            yield [-radius + j + 1, -j - 1] as v2;
        }
    }
}

export function* disc(radius: number) {
    for (let i = 0; i < radius; i++) {
        yield* circle(i);
    }
}
