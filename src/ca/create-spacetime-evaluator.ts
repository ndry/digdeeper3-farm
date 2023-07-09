import { parseFullTransitionLookupTable } from ".";
import { Code } from "./code";
import { fillSpace } from "./fill-space";

export function createSpacetimeEvaluator({
    code, spaceSize, startFillState, random32,
}: {
    code: Code;
    spaceSize: number;
    timeSize: number;
    startFillState: number;
    random32: () => number;
}) {
    const { stateCount } = code;
    const table = parseFullTransitionLookupTable(code);

    const spacetime = [
        Array.from({ length: spaceSize }, () => startFillState),
        Array.from({ length: spaceSize }, () => random32() % stateCount),
        Array.from({ length: spaceSize }, () => random32() % stateCount),
    ];

    const _at = (t: number, x: number) => {
        while (t >= spacetime.length) {
            const space = Array.from({ length: spaceSize }, () => 0);
            space[0] = random32() % stateCount;
            space[space.length - 1] = random32() % stateCount;
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