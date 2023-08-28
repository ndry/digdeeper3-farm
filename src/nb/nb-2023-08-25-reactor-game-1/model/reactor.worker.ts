import { selectByWeight } from "../../../utils/select-by-weight";
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

    const perfStart = performance.now();
    const selectedReaction = selectByWeight(
        reactions,
        r => r.priority,
        Math.random(), // TODO: use a seeded random number generator
    );
    const selectedReaction1 = performReactorTick(selectedReaction, {
        reactionMultistepSize: 1500,
        reactionMultistepsPerTick: 100,
        reactionRepeatSearchWindow: 1000,
    });
    const perfEnd = performance.now();

    postMessage({
        type: "tick",
        perf: perfEnd - perfStart,
        reaction: selectedReaction1,
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