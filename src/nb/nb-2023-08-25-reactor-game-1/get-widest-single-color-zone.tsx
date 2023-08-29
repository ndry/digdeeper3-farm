import { getFullCombinedState } from "../../ca";
import { parseTable } from "../../ca237v1/rule-io";
import { stateCount } from "../../ca237v1/state-count";
import { ReactionSeed } from "./model/perform-reactor-tick";

export const getWidestSingleColorZone =
    (reactionSeed: ReactionSeed, tCap: number) => {
        const table = parseTable(reactionSeed.rule);
        let prevSpace = parseTable(reactionSeed.reagent0);
        let space = parseTable(reactionSeed.reagent1);

        let maxMatch = 1;
        let tempCountMatch = 1;


        for (let ti = 0; ti < tCap; ti++) {
            const nextSpace = space.map((_, x) => table[getFullCombinedState(
                stateCount,
                space.at(x - 1)!,
                space[x],
                space.at(x - space.length + 1)!,
                prevSpace[x])]);

            prevSpace = space;
            space = nextSpace;
            for (let i = 0; i < space.length - 1; i++) {
                if (space[i] === space[i + 1]) {
                    tempCountMatch++;
                    maxMatch = Math.max(maxMatch, tempCountMatch);
                } else {
                    tempCountMatch = 1;
                }
            }
        }
        return maxMatch;
    };