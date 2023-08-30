import { Rule, parseTable } from "../../../ca237v1/rule-io";
import { fillPrestartedSpacetime81Pbc } from "./fill-prestarted-spacetime81-pbc";
import { findRepeat } from "./find-repeat";
import { _never } from "../../../utils/_never";
import update from "immutability-helper";
import { ReactionCard } from "./reaction-card";
import { evolveThreeSpace81PbcInPlace } from "./evolve-three-space81-pbc-in-place";
import { getReagent0, getReagent1, getRule } from "./reaction-seed";


let spacetime: Uint8Array;

const prevPrevSpace = new Uint8Array(81);
const prevSpace = new Uint8Array(81);
const space = new Uint8Array(81);

export const performReactorTick = (
    reaction: ReactionCard,
    {
        dt,
        reactionRepeatSearchWindow,
    }: {
        dt: number,
        reactionRepeatSearchWindow: number,
    },
) => {
    const table = parseTable(getRule(reaction.reactionSeed));
    let t = reaction.t;

    prevPrevSpace.set(reaction.last281.slice(0, 81));
    prevSpace.set(reaction.last281.slice(81, 81 * 2));
    dt -= dt % 3;
    evolveThreeSpace81PbcInPlace(table, prevPrevSpace, prevSpace, space, dt);
    t += dt;
    if (!spacetime || spacetime.length !== reactionRepeatSearchWindow * 81) {
        spacetime = new Uint8Array(reactionRepeatSearchWindow * 81);
    }
    spacetime.set(prevPrevSpace, 0);
    spacetime.set(prevSpace, 81);
    fillPrestartedSpacetime81Pbc(spacetime, table);
    const last281 = spacetime.slice(spacetime.length - 81 * 2);
    const repeatAtRel = findRepeat(spacetime);
    if (repeatAtRel !== -1) {
        const repeatAt = t + repeatAtRel;
        const markTRel = Math.max(0, repeatAtRel - 350);
        const markT = t + markTRel;
        reaction = update(reaction, {
            repeatAt: { $set: repeatAt },
            marks: {
                start: {
                    $set: {
                        t: 2,
                        last281: new Uint8Array([
                            ...parseTable(getReagent0(reaction.reactionSeed)),
                            ...parseTable(getReagent1(reaction.reactionSeed)),
                        ]),
                    },
                },
                lastNonRepeat: {
                    $set: {
                        t: reaction.t,
                        last281: reaction.last281,
                    },
                },
                repeat: {
                    $set: {
                        t: markT + 2,
                        last281: spacetime.slice(
                            markTRel * 81,
                            (markTRel + 2) * 81),
                    },
                },
            },
        });
    }

    t += reactionRepeatSearchWindow;

    return update(reaction, {
        t: { $set: t },
        last281: { $set: last281 },
    });
};
