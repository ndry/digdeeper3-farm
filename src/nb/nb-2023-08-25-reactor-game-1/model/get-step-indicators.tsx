import { getLatestOutput, getRepeatedAt } from "./reaction-output-registry";
import { ReactionSeed } from "./reaction-seed";


export function getStepIndicators(reactions: ReactionSeed[]): {
    steps: number, repeatAt: number, stepRatio: number
} {
    let steps = 0;
    let repeatAt = 0;

    for (const reaction of reactions) {
        steps += getLatestOutput(reaction)?.t ?? 0;
        repeatAt += getRepeatedAt(reaction) ?? 0;
    }
    return {
        steps,
        repeatAt,
        stepRatio: repeatAt / steps,
    };
}