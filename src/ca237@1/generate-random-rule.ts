import { keyifyTable } from "./rule-io";
import { buildFullTransitionLookupTable } from "./build-full-transition-lookup-table";
import { stateCount } from "./state-count";


export const generateRandomRule =
    (random01 = Math.random) =>
        keyifyTable(
            buildFullTransitionLookupTable(
                stateCount,
                () => Math.floor(random01() * stateCount)));