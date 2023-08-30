import { keyifyTable } from "../../../ca237v1/rule-io";
import { selectIndexByWeight } from "../../../utils/select-by-weight";
import { performReactorTick } from "./perform-reactor-tick";
import { ReactionCard } from "./reaction-card";
import { registerReactionOutput, subscribeToReactionOutputGlobal } from "./reaction-output-registry";
import { getRule, keyify } from "./reaction-seed";




let isRunning = false;
let reactions = [] as ReactionCard[];

let h: ReturnType<typeof setTimeout> | undefined;
const scheduleTick = () => {
    clearTimeout(h);
    h = setTimeout(tick, 0);
};

const us1 = subscribeToReactionOutputGlobal(ro => {
    postMessage({
        type: "reactionOutput",
        reactionOutput: ro,
    });
});

function tick() {
    if (!isRunning) { return; }
    if (reactions.length === 0) { return; }

    const subtickCount = 50;
    const dt = 30000;
    let steps = 0;

    const perfStart = performance.now();
    const indices = new Set<number>();
    for (let i = 0; i < subtickCount; i++) {
        const selectedReactionIndex = selectIndexByWeight(
            reactions,
            r => r.priority,
            Math.random(), // TODO: use a seeded random number generator
        );
        const selectedReaction = reactions[selectedReactionIndex];
        if (selectedReaction.repeatAt !== undefined) { continue; }
        indices.add(selectedReactionIndex);
        const selectedReaction1 = performReactorTick(selectedReaction, {
            dt,
            reactionRepeatSearchWindow: 1500,
        });

        reactions[selectedReactionIndex] = selectedReaction1; // in-place update
        steps += selectedReaction1.t - selectedReaction.t;

        registerReactionOutput({
            seed: selectedReaction.reactionSeed,
            t: selectedReaction1.t,
            output: keyify(
                getRule(selectedReaction.reactionSeed),
                keyifyTable(selectedReaction.last281.slice(0, 81)),
                keyifyTable(selectedReaction.last281.slice(81, 81 * 2)),
            ),
            tags: [],
        });
    }
    const perfEnd = performance.now();

    postMessage({
        type: "tick",
        perf: perfEnd - perfStart,
        steps,
        reactions: [...indices].map(i => reactions[i]),
    });

    scheduleTick();
}

onmessage = (ev: MessageEvent<{
    type: "isRunning",
    isRunning: boolean,
} | {
    type: "reactions",
    reactions: ReactionCard[],
}>) => {
    if (ev.data.type === "isRunning") {
        isRunning = ev.data.isRunning;
        scheduleTick();
        return;
    }
    if (ev.data.type === "reactions") {
        reactions = ev.data.reactions;
        scheduleTick();
        return;
    }
};