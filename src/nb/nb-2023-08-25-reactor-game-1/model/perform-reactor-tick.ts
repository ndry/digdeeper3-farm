import { Rule, keyifyTable, parseTable } from "../../../ca237v1/rule-io";
import { fillPrestartedSpacetime81Pbc } from "./fill-prestarted-spacetime81-pbc";
import { findRepeat } from "./find-repeat";
import { _never } from "../../../utils/_never";
import { evolveThreeSpace81PbcInPlace } from "./evolve-three-space81-pbc-in-place";
import { ReactionSeed, getReagent0, getReagent1, getRule, keyify } from "./reaction-seed";
import { ReactionOutput } from "./reaction-output-registry";


let spacetime: Uint8Array;

const table = new Uint8Array(81);
const prevPrevSpace = new Uint8Array(81);
const prevSpace = new Uint8Array(81);
const space = new Uint8Array(81);

export const performReactorTick = (
    reactionSeed: ReactionSeed,
    {
        dt,
        reactionRepeatSearchWindow,
    }: {
        dt: number,
        reactionRepeatSearchWindow: number,
    },
) => {
    const rule = getRule(reactionSeed);
    table.set(parseTable(rule));
    prevPrevSpace.set(parseTable(getReagent0(reactionSeed)));
    prevSpace.set(parseTable(getReagent1(reactionSeed)));

    let t = 0;
    const outputs = [] as ReactionOutput[];

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
        outputs.push({
            seed: reactionSeed,
            t: repeatAt,
            output: keyify(
                rule,
                keyifyTable(spacetime.slice(
                    repeatAtRel * 81, (repeatAtRel + 1) * 81)),
                keyifyTable(spacetime.slice(
                    (repeatAtRel + 1) * 81, (repeatAtRel + 2) * 81))),
            tags: ["prerepeat"],
        });

        const markTRel = Math.max(0, repeatAtRel - 350);
        const markT = t + markTRel;
        outputs.push({
            seed: reactionSeed,
            t: markT,
            output: keyify(
                rule,
                keyifyTable(spacetime.slice(
                    markTRel * 81, (markTRel + 1) * 81)),
                keyifyTable(spacetime.slice(
                    (markTRel + 1) * 81, (markTRel + 2) * 81))),
            tags: ["repeat"],
        });
    }

    t += reactionRepeatSearchWindow;
    outputs.push({
        seed: reactionSeed,
        t,
        output: keyify(
            rule,
            keyifyTable(last281.slice(0, 81)),
            keyifyTable(last281.slice(81, 81 * 2)),
        ),
        tags: [],
    });

    return { outputs, steps: t };
};
