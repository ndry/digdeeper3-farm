import { Rule, keyifyTable, parseTable } from "../../../ca237v1/rule-io";
import { fillPrestartedSpacetime81Pbc } from "./fill-prestarted-spacetime81-pbc";
import { findRepeat, findRepeatFast } from "./find-repeat";
import { _never } from "../../../utils/_never";
import { evolveThreeSpace81PbcInPlace } from "./evolve-three-space81-pbc-in-place";
import { ReactionSeed, getReagent0, getReagent1, getRule, keyify } from "./reaction-seed";
import { ReactionOutput } from "./reaction-output-registry";


let spacetime: Uint8Array;
let spacetime1: Uint8Array;

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
    outputs.push({
        seed: reactionSeed,
        t: dt,
        output: keyify(
            rule,
            keyifyTable(prevPrevSpace),
            keyifyTable(prevSpace),
        ),
        tags: [],
    });




    if (!spacetime || spacetime.length !== reactionRepeatSearchWindow * 81) {
        spacetime = new Uint8Array(reactionRepeatSearchWindow * 81);
    }
    spacetime.set(prevPrevSpace, 0);
    spacetime.set(prevSpace, 81);
    fillPrestartedSpacetime81Pbc(spacetime, table);
    if (findRepeatFast(spacetime) !== -1) {
        if (!spacetime1 || spacetime1.length !== (dt + 2) * 81) {
            spacetime1 = new Uint8Array((dt + 2) * 81);
        }
        spacetime1.set(parseTable(getReagent0(reactionSeed)));
        spacetime1.set(parseTable(getReagent1(reactionSeed)), 81);
        fillPrestartedSpacetime81Pbc(spacetime1, table);
        const r = findRepeat(spacetime1);
        if (r) {
            const { repeatAt, rerepatStartAt } = r;
            outputs.push({
                seed: reactionSeed,
                t: rerepatStartAt,
                output: keyify(
                    rule,
                    keyifyTable(spacetime1.slice(
                        rerepatStartAt * 81, (rerepatStartAt + 1) * 81)),
                    keyifyTable(spacetime1.slice(
                        (rerepatStartAt + 1) * 81, (rerepatStartAt + 2) * 81))),
                tags: ["repeat-start"],
            });

            outputs.push({
                seed: reactionSeed,
                t: repeatAt,
                output: keyify(
                    rule,
                    keyifyTable(spacetime1.slice(
                        repeatAt * 81, (repeatAt + 1) * 81)),
                    keyifyTable(spacetime1.slice(
                        (repeatAt + 1) * 81, (repeatAt + 2) * 81))),
                tags: ["repeat"],
            });

            const markT = Math.max(0, repeatAt - 350);
            outputs.push({
                seed: reactionSeed,
                t: markT,
                output: keyify(
                    rule,
                    keyifyTable(spacetime1.slice(
                        markT * 81, (markT + 1) * 81)),
                    keyifyTable(spacetime1.slice(
                        (markT + 1) * 81, (markT + 2) * 81))),
                tags: ["prerepeat"],
            });

            const markStartT = Math.max(0, rerepatStartAt - 350);
            outputs.push({
                seed: reactionSeed,
                t: markStartT,
                output: keyify(
                    rule,
                    keyifyTable(spacetime1.slice(
                        markStartT * 81, (markStartT + 1) * 81)),
                    keyifyTable(spacetime1.slice(
                        (markStartT + 1) * 81, (markStartT + 2) * 81))),
                tags: ["prerepeat-start"],
            });
        }
    }

    return { outputs, steps: t };
};
