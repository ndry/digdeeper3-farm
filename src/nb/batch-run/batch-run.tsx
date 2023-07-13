import { _never } from "../../utils/_never";
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
    copilotModel?: ReadonlyDeep<{
        id: string,
        // model: tf.Sequential,
    }>,
    runArgss: ReadonlyArray<Readonly<{
        tickSeed: number;
        /**
        * If provided, should be initialized with a length.
        * Will be filled each step as long as step < length.
        */
        stepRecorder?: Uint8Array;
        recordedSteps?: Uint8Array; // Readonly<Uint8Array>
    }>>;
}>) {
    const { dropzone, runArgss } = args;
    const runs = runArgss.map(runArgs => ({
        runArgs,
        stepRandom32: createMulberry32(runArgs.tickSeed),
        run: createDropState(dropzone),
        get batch() { return batch; },
    }));
    let stepCount = 0;
    const lastDirections = new Uint8Array(runs.length);
    const step = () => {
        for (let i = 0; i < runs.length; i++) {
            const {
                runArgs: { stepRecorder, recordedSteps }, run, stepRandom32,
            } = runs[i];
            const direction =
                recordedSteps
                    ? ((recordedSteps[stepCount] ?? _never()) as 0 | 1 | 2 | 3)
                    : getRandomWalkerStep({
                        relativeAtWithBounds: run.relativeAtWithBounds,
                        random32: stepRandom32,
                        stateCount: dropzone.code.stateCount,
                    });
            lastDirections[i] = direction;
            if (stepRecorder && stepCount < stepRecorder.length) {
                stepRecorder[stepCount] = direction;
            }
            run.step(direction);
        }
        stepCount++;
    };
    const batch = {
        step,
        args,
        runs,
        get stepCount() { return stepCount; },
        lastDirections,
    };
    return batch;
}
