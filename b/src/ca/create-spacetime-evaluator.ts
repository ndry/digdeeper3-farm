import { parseFullTransitionLookupTable } from ".";
import { LehmerPrng } from "../utils/lehmer-prng";
import { Code } from "./code";
import { fillSpace } from "./fill-space";

export function createSpacetimeEvaluator({
    code, spaceSize, seed, startFillState,
}: {
    code: Code;
    spaceSize: number;
    timeSize: number;
    startFillState: number;
    seed: number;
}) {
    const { stateCount } = code;
    const table = parseFullTransitionLookupTable(code);
    const random = new LehmerPrng(seed);

    const spacetime = [
        Array.from({ length: spaceSize }, () => startFillState),
        Array.from({ length: spaceSize }, () => random.next() % stateCount),
        Array.from({ length: spaceSize }, () => random.next() % stateCount),
    ];

    const _at = (t: number, x: number) => {
        while (t >= spacetime.length) {
            const space = Array.from({ length: spaceSize }, () => 0);
            space[0] = random.next() % stateCount;
            space[space.length - 1] = random.next() % stateCount;
            spacetime.push(space);
            fillSpace(
                stateCount,
                spacetime[spacetime.length - 3],
                spacetime[spacetime.length - 2],
                spacetime[spacetime.length - 1],
                table);
        }
        return spacetime[t][x];
    };
    const at = (t: number, x: number) => {
        if (t < 0) { return; }
        if (x < 0 || x >= spaceSize) { return; }
        return _at(t, x);
    };

    return {
        spacetime,
        _at,
        at,
    };
}