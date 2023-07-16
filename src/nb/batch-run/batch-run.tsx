import { _never } from "../../utils/_never";
import { createMulberry32 } from "../../utils/mulberry32";
import { ReadonlyDeep } from "../../utils/readonly-deep";
import { Dropzone } from "../nb-2023-07-06/run";
import { createDropState } from "./drop-state";
import { getNeuralWalkerStep, neuralWalkerSightLength } from "./neural-walker";
import { getRandomWalkerStep } from "./random-walker";
import * as tf from "@tensorflow/tfjs";


/**
 * Runs a batch of agents with a common step strategy
 * in a same (but not shared) zone
 */
export function createBatchRun(args: Readonly<{
    dropzone: ReadonlyDeep<Dropzone>,
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
    }>>,
    perfId?: string,
}>) {
    const { dropzone, runArgss, copilotModel, perfId } = args;
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
    const neuralStep = async () => {
        // assert(copilotModel);
        const _copilotModel = copilotModel as NonNullable<typeof copilotModel>;
        const { model } = _copilotModel;
        performance.mark(perfId + "_100");
        for (let i = 0; i < runs.length; i++) {
            runs[i].run.getNeuralWalkerSightInto(
                inputs,
                i * neuralWalkerSightLength);
        }
        performance.mark(perfId + "_200");
        const inputsTensor = tf.tensor(inputs, inputsShape);
        const predictionsTesor = model.predict(
            inputsTensor,
            { batchSize: runs.length }) as tf.Tensor;
        inputsTensor.dispose();
        performance.mark(perfId + "_400");
        const predictions = await predictionsTesor.data();
        performance.mark(perfId + "_500");
        predictionsTesor.dispose();
        for (let i = 0; i < runs.length; i++) {
            const x = runs[i];

            const prediction = predictions.subarray(i * 4, (i + 1) * 4);
            const direction = getNeuralWalkerStep({
                relativeAtWithBounds: x.run.relativeAtWithBounds.bind(x.run),
                random32: x.stepRandom32,
                stateCount: dropzone.code.stateCount,
            }, [...prediction]);

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

        performance.mark(perfId + "_900");

        performance.measure(perfId + "_100-200",
            perfId + "_100", perfId + "_200");
        performance.measure(perfId + "_100-900",
            perfId + "_100", perfId + "_900");
        performance.measure(perfId + "_500-900",
            perfId + "_500", perfId + "_900");
        performance.measure(perfId + "_100-400",
            perfId + "_100", perfId + "_400");

    };

    const step: () => Promise<void> | void =
        copilotModel
            ? neuralStep
            : () => {
                for (let i = 0; i < runs.length; i++) {
                    const {
                        runArgs: { stepRecorder, recordedSteps },
                        run,
                        stepRandom32,
                    } = runs[i];
                    const direction =
                        recordedSteps
                            ? ((
                                recordedSteps[stepCount] ?? _never()
                            ) as 0 | 1 | 2 | 3)
                            : getRandomWalkerStep({
                                relativeAtWithBounds:
                                    run.relativeAtWithBounds.bind(run),
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
                // return Promise.resolve();
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
