import { Rule, parseTable } from "./rule-io";
import { stateCount } from "./state-count";
import { fillSpace } from "./fill-space";


export function fillSpacetime({
    rule, spaceSize, timeSize, startFillState, random32,
}: {
    rule: Rule;
    spaceSize: number;
    timeSize: number;
    startFillState: number;
    random32: () => number;
}) {
    const table = parseTable(rule);

    const spacetime = [
        Array.from({ length: spaceSize }, () => startFillState),
        Array.from({ length: spaceSize }, () => random32() % stateCount),
        Array.from({ length: spaceSize }, () => random32() % stateCount),
    ];

    while (timeSize >= spacetime.length) {
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

    return spacetime;
}
