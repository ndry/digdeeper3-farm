import { LehmerPrng } from "../utils/lehmer-prng";
import { fillSpace } from "./fill-space";
import { parseFullTransitionLookupTable } from ".";
import memoize from "memoizee";
import { Code } from "./code";


const _calculateComposition = memoize((stateCount: number, rule: string) => {
    const table = parseFullTransitionLookupTable({ stateCount, rule });

    const spaceSize = 100;
    const timeSize = 1000;

    const spaceMargin = 2;
    const timeMargin = 5;

    const random = new LehmerPrng(4242);

    let prevPrevSpace =
        Array.from({ length: spaceSize }, () => random.next() % stateCount);
    let prevSpace =
        Array.from({ length: spaceSize }, () => random.next() % stateCount);
    let space =
        Array.from({ length: spaceSize }) as number[];

    let t = 2;

    const compostion = Array.from({ length: stateCount }, () => 0);

    for (; t < timeSize; t++) {
        space[0] = random.next() % stateCount;
        space[space.length - 1] = random.next() % stateCount;
        fillSpace(stateCount, prevPrevSpace, prevSpace, space, table);

        const tmp = space;
        prevPrevSpace = prevSpace;
        prevSpace = space;
        space = tmp;

        if (t < timeMargin) { continue; }

        for (let x = spaceMargin; x < spaceSize - spaceMargin; x++) {
            compostion[space[x]]++;
        }
    }

    const sum = compostion.reduce((a, b) => a + b, 0);
    return compostion.map(c => c / sum);
});

export const getComposition = (caCode: Code) => 
    _calculateComposition(caCode.stateCount, caCode.rule);
