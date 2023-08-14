import { buildFullTransitionLookupTable } from "../../ca237v1/build-full-transition-lookup-table";
import { keyifyTable } from "../../ca237v1/rule-io";
import { stateCount } from "../../ca237v1/state-count";

export const sShiftLeft = keyifyTable(buildFullTransitionLookupTable(
    stateCount,
    (stateCount, n1, c, n2, p) => {
        return n2;
    }));

export const sShiftRight = keyifyTable(buildFullTransitionLookupTable(
    stateCount,
    (stateCount, n1, c, n2, p) => {
        return n1;
    }));

export const sMiddleOne = keyifyTable(Array.from(
    { length: 81 },
    (_, i) => i === 40 ? 1 : 0));

export const sRightOne = keyifyTable(Array.from(
    { length: 81 },
    (_, i) => i === 80 ? 1 : 0));

export const sLeftOne = keyifyTable(Array.from(
    { length: 81 },
    (_, i) => i === 0 ? 1 : 0));

export const sSum = keyifyTable(buildFullTransitionLookupTable(
    stateCount,
    (stateCount, n1, c, n2, p) => {
        return (c + p) % stateCount;
    }));