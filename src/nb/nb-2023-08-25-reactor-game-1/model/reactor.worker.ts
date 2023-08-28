import { selectIndexByWeight } from "../../../utils/select-by-weight";
import { performReactorTick } from "./perform-reactor-tick";
import { ReactionCard } from "./reaction-card";

let isRunning = false;
let reactions = [] as ReactionCard[];

let h: ReturnType<typeof setTimeout> | undefined;
const scheduleTick = () => {
    clearTimeout(h);
    h = setTimeout(tick, 0);
};

function tick() {
    if (!isRunning) { return; }
    if (reactions.length === 0) { return; }

    const subtickCount = 50;
    const reactionMultistepSize = 1500;
    const reactionMultistepsPerTick = 20;
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
            reactionMultistepSize,
            reactionMultistepsPerTick,
            reactionRepeatSearchWindow: 1500,
        });

        reactions[selectedReactionIndex] = selectedReaction1; // in-place update
        steps += reactionMultistepSize * reactionMultistepsPerTick;
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