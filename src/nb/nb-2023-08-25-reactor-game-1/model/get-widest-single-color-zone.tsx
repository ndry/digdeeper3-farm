import memoize from "memoizee";
import { getFullCombinedState } from "../../../ca";
import { parseTable } from "../../../ca237v1/rule-io";
import { stateCount } from "../../../ca237v1/state-count";
import * as ReactionSeed from "./reaction-seed";

export const getWidestSingleColorZone = memoize(
    (reactionSeed: ReactionSeed.ReactionSeed, tCap: number) => {
        const table = parseTable(ReactionSeed.getRule(reactionSeed));
        let prevSpace = parseTable(ReactionSeed.getReagent0(reactionSeed));
        let space = parseTable(ReactionSeed.getReagent1(reactionSeed));

        let maxMatch = 1;

        for (let ti = 0; ti < tCap; ti++) {
            const nextSpace = space.map((_, x) => table[getFullCombinedState(
                stateCount,
                space.at(x - 1)!,
                space[x],
                space.at(x - space.length + 1)!,
                prevSpace[x])]);

            prevSpace = space;
            space = nextSpace;
            let tempCountMatch = 1;
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
    });