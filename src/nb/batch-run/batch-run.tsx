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


    // if (copilotModel) //
    const inputs = new Float32Array(runs.length * neuralWalkerSightLength);
    const inputsShape = [runs.length, neuralWalkerSightLength];
    const neuralStep = () => {
        // assert(copilotModel);
        const { model } = copilotModel as NonNullable<typeof copilotModel>;
        for (let i = 0; i < runs.length; i++) {
            getNeuralWalkerSightInto(
                runs[i].run,
                inputs,
                i * neuralWalkerSightLength);
        }
        const inputsTensor = tf.tensor(inputs, inputsShape);
        const predictionsTesor = model.predict(
            inputsTensor,
            { batchSize: runs.length }) as tf.Tensor;
        inputsTensor.dispose();
        const predictions = predictionsTesor.dataSync();
        predictionsTesor.dispose();
        for (let i = 0; i < runs.length; i++) {
            const x = runs[i];

            const prediction = predictions.slice(i * 4, (i + 1) * 4);
            const direction = getNeuralWalkerStep({
                relativeAtWithBounds: x.run.relativeAtWithBounds.bind(x.run),
                prediction: [...prediction],
                random32: x.stepRandom32,
                stateCount: dropzone.code.stateCount,
            });

            lastDirections[i] = direction;
            if (
                x.runArgs.stepRecorder
                && stepCount < x.runArgs.stepRecorder.length
            ) {
                x.runArgs.stepRecorder[stepCount] = direction;
            }
            x.run.step(direction);
        }

        stepCount++;
    };

    const step =
        copilotModel
            ? neuralStep
            : () => {
                for (let i = 0; i < runs.length; i++) {
                    const {
                        runArgs: { stepRecorder, recordedSteps }, run, stepRandom32,
                    } = runs[i];
                    const direction =
                        recordedSteps
                            ? ((recordedSteps[stepCount] ?? _never()) as 0 | 1 | 2 | 3)
                            : getRandomWalkerStep({
                                relativeAtWithBounds: run.relativeAtWithBounds.bind(run),
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
