import { performReactorTick } from "./perform-reactor-tick";
import { selectByWeight } from "../../../utils/select-by-weight";
import update from "immutability-helper";
import { ReactionCard } from "./reaction-card";
import { ReadonlyDeep } from "../../../utils/readonly-deep";



export const createReactor = ({
    isRunning, reactions, onTick,
}: {
    isRunning: boolean;
    reactions: ReadonlyDeep<ReactionCard[]>;
    onTick: (x: {
        perf: number;
        reactions: ReactionCard[];
    } | "exhausted") => void;
}) => {
    let h: ReturnType<typeof setTimeout> | undefined;
    const tick = () => {
        // if (!isRunning) { return; }
        const perfStart = performance.now();

        const eligibleReactions = reactions
            .filter(r => !r.isPaused
                && !r.isTrashed
                && r.repeatAt === undefined
                && r.priority > 0);

        if (eligibleReactions.length === 0) {
            onTick("exhausted");
            return;
        }

        const selectedReaction = selectByWeight(
            eligibleReactions,
            r => r.priority,
            Math.random(),
        );


        const selectedReaction1 = performReactorTick(selectedReaction, {
            reactionMultistepSize: 1500,
            reactionMultistepsPerTick: 100,
            reactionRepeatSearchWindow: 1000,
        });

        const perfEnd = performance.now();

        reactions = update(reactions, {
            [reactions.indexOf(selectedReaction)]: {
                $set: selectedReaction1,
            },
        });
        onTick({
            perf: perfEnd - perfStart,
            reactions,
        });
        h = setTimeout(tick, 10);
    };
    if (isRunning) { tick(); }

    return {
        setIsRunning(value: typeof isRunning) {
            isRunning = value;
            if (isRunning) {
                tick();
            } else {
                clearTimeout(h);
            }
        },
        setReactions(value: typeof reactions) {
            reactions = value;
        },
        dispose() {
            clearTimeout(h);
        },
    };
};
