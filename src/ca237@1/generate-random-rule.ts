import { keyifyTable, stateCount } from ".";
import { buildFullTransitionLookupTable } from "./build-full-transition-lookup-table";


export const generateRandomRule =
    (random01 = Math.random) =>
        keyifyTable(
            buildFullTransitionLookupTable(
                stateCount,
                () => Math.floor(random01() * stateCount)));