import { _never } from "../../utils/_never";
import { createMulberry32 } from "../../utils/mulberry32";
import { ReadonlyDeep } from "../../utils/readonly-deep";
import { Dropzone } from "../nb-2023-07-06/run";
import { createDropState } from "./drop-state";
import { getNeuralWalkerSightInto, getNeuralWalkerStep, neuralWalkerSightLength } from "./neural-walker";
import { getRandomWalkerStep } from "./random-walker";
import * as tf from "@tensorflow/tfjs";


/**
 * Runs a batch of agents with a common step strategy
 * in a same (but not shared) zone
 */
export function createBatchRun(args: Readonly<{
    dropzone: ReadonlyDeep<Dropzone>;
    copilotModel?: ReadonlyDeep<{
        id: string,
        model: tf.Sequential,
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
    const { dropzone, runArgss, copilotModel } = args;
    const runs = runArgss.map(runArgs => ({
        runArgs,
        stepRandom32: createMulberry32(runArgs.tickSeed),
        run: createDropState(dropzone),
        get batch() { return batch; },
    }));
    let stepCount = 0;
    const lastDirections = new Uint8Array(runs.length);

    const step =
        copilotModel
            ? () => {
                const { model } = copilotModel;
                const inputs = new Float32Array(
                    runs.length * neuralWalkerSightLength);
                for (let i = 0; i < runs.length; i++) {
                    getNeuralWalkerSightInto(
                        runs[i].run,
                        inputs,
                        i * neuralWalkerSightLength);
                }
                const inputsTensor = tf.tensor(
                    inputs,
                    [runs.length, neuralWalkerSightLength]);
                const predictionsTesor = model.predict(
                    inputsTensor,
                    { batchSize: runs.length }) as tf.Tensor;
                inputsTensor.dispose();
                const predictions = predictionsTesor.dataSync();
                predictionsTesor.dispose();
                for (let i = 0; i < runs.length; i++) {
                    const {
                        runArgs: { stepRecorder }, run, stepRandom32,
                    } = runs[i];

                    const prediction = predictions.slice(i * 4, (i + 1) * 4);
                    const direction = getNeuralWalkerStep({
                        relativeAtWithBounds: run.relativeAtWithBounds,
                        prediction: [...prediction],
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
            }
            : () => {
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
