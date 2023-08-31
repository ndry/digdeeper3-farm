import { ReactionCard } from "../model/reaction-card";
import { getLatestOutput, getRepeatedAt } from "../model/reaction-output-registry";


export function getStepIndicators(reactions: ReactionCard[]): {
    steps: number, repeatAt: number, stepRatio: number
} {
    let steps = 0;
    let repeatAt = 0;

    for (const reaction of reactions) {
        steps += getLatestOutput(reaction.reactionSeed)?.t ?? 0;
        repeatAt += getRepeatedAt(reaction.reactionSeed) ?? 0;
    }
    return {
        steps,
        repeatAt,
        stepRatio: repeatAt / steps,
    };
}