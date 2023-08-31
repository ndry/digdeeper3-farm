import { ReactionCard } from "../model/reaction-card";


export function getStepIndicators(reactions: ReactionCard[]): {
    steps: number, repeatAt: number, stepRatio: number
} {
    let steps = 0;
    let repeatAt = 0;

    for (const reaction of reactions) {
        steps = steps + reaction.t;
        reaction.repeatAt && (repeatAt = repeatAt + reaction.repeatAt);
    }
    return {
        steps,
        repeatAt,
        stepRatio: repeatAt !== 0 ? steps / repeatAt : 0,
    };
}