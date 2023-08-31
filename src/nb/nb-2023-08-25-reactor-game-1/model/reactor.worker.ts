import { selectByWeight, selectIndexByWeight } from "../../../utils/select-by-weight";
import { performReactorTick } from "./perform-reactor-tick";
import { ReactionCard } from "./reaction-card";
import { getLatestOutput, hasSeedRepeated, reactionOutputRegistry, registerReactionOutput, subscribeToReactionOutputGlobal } from "./reaction-output-registry";
import { ReactionSeed } from "./reaction-seed";




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

    const dt = 30000;

    const perfStart = performance.now();
    const selectedReaction = selectByWeight(
        reactions,
        r => r.priority,
        Math.random(), // TODO: use a seeded random number generator
    );
    if (hasSeedRepeated(selectedReaction.reactionSeed)) {
        scheduleTick();
        return;
    }
    const latestOuput = getLatestOutput(selectedReaction.reactionSeed);
    const { outputs, steps } = performReactorTick(
        latestOuput?.output ?? selectedReaction.reactionSeed,
        {
            dt,
            reactionRepeatSearchWindow: 1500,
        });
    for (const output of outputs) {
        registerReactionOutput(output);
        if (latestOuput) {
            registerReactionOutput({
                seed: selectedReaction.reactionSeed,
                t: output.t + latestOuput.t,
                output: output.output,
                tags: output.tags,
            });
        }
    }

    const perfEnd = performance.now();

    postMessage({
        type: "tick",
        perf: perfEnd - perfStart,
        steps,
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