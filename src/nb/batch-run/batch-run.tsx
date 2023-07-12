import { createMulberry32 } from "../../utils/mulberry32";
import { ReadonlyDeep } from "../../utils/readonly-deep";
import { Dropzone } from "../nb-2023-07-06/run";
import { createDropState } from "./drop-state";
import { getRandomWalkerStep } from "./random-walker";

/**
 * Runs a batch of agents with a common step strategy
 * in a same (but not shared) zone
 */
export function createBatchRun(args: Readonly<{
    dropzone: ReadonlyDeep<Dropzone>;
    // copilotModel?: ReadonlyDeep<{
    //     id: string,
    //     model: tf.Sequential,
    // }>,
    batch: ReadonlyArray<Readonly<{
        tickSeed: number;
        /**
        * If provided, should be initialized with a length.
        * Will be filled each step as long as step < length.
        */
        stepRecorder?: Uint8Array;
        recordedSteps?: Uint8Array; // Readonly<Uint8Array>
    }>>;
}>) {
    const { dropzone, batch } = args;
    const runs = batch.map(entryArgs => ({
        entryArgs,
        stepRandom32: createMulberry32(entryArgs.tickSeed),
        run: createDropState(dropzone),
    }));
    let stepCount = 0;
    const step = () => {
        for (const {
            entryArgs: { stepRecorder }, run, stepRandom32,
        } of runs) {
            const direction = getRandomWalkerStep({
                relativeAtWithBounds: run.relativeAtWithBounds,
                random32: stepRandom32,
                stateCount: dropzone.code.stateCount,
            });
            if (stepRecorder && stepCount < stepRecorder.length) {
                stepRecorder[stepCount] = direction;
            }
            run.step(direction);
        }
        stepCount++;
    };
    return {
        step,
        get stepCount() { return stepCount; },
        get runs() { return runs as Readonly<typeof runs>; },
    };
}
