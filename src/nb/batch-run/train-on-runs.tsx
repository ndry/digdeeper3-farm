import * as tf from "@tensorflow/tfjs";
import { createBatchRun } from "./batch-run";
import { createModel } from "../nb-2023-07-06/train-model";
import { ReadonlyDeep } from "../../utils/readonly-deep";



export async function trainOnRuns({
    runs,
    batchSize,
    batchCount,
    log = console.log.bind(console),
}: {
    /** Runs are expected to be sorted, fittest first */
    runs: ReadonlyDeep<ReturnType<typeof createBatchRun>["runs"][0][]>,
    batchSize: number,
    batchCount: number,
    log?: (msg: any) => void,
}) {
    const bestRun = runs[0];
    const modelExists = !!bestRun.batch.args.copilotModel;

    await bestRun.batch.args.copilotModel?.model.save("indexeddb://nb-batch-run-0");
    await tf.setBackend("webgl");
    const model = modelExists
        ? (await tf.loadLayersModel("indexeddb://nb-batch-run-0")) as tf.Sequential
        : createModel({
            stateLength: bestRun.run.getSight().length,
            batchSize,
        });

    model.compile({
        optimizer: tf.train.adam(),
        loss: "sparseCategoricalCrossentropy",
        metrics: ["accuracy"],
    });

    await model.fitDataset(tf.data.generator(function* () {
        for (let i = runs.length - 1; i >= 0; i--) {
            const theRun = createBatchRun({
                dropzone: runs[i].batch.args.dropzone,
                runArgss: [{
                    tickSeed: runs[i].runArgs.tickSeed,
                    recordedSteps: runs[i].runArgs.stepRecorder,
                }],
            });
            for (let bi = 0; bi < batchCount; bi++) {
                const perfStart = performance.now();
                const xs = [];
                const ys = [];
                for (let bj = 0; bj < batchSize; bj++) {
                    xs.push(theRun.runs[0].run.getSight());
                    theRun.step();
                    ys.push(theRun.lastDirections[0]);
                }
                const perfEnd = performance.now();
                log({
                    trainModel: "tickCount",
                    tickCount: theRun.stepCount,
                    perf: perfEnd - perfStart,
                    i, bi,
                });
                yield {
                    xs: tf.tensor(xs),
                    ys: tf.tensor(ys),
                };
            }
        }
    }), {
        epochs: 1,
        callbacks: {
            onEpochEnd: (epoch, logs) => {
                log({ trainModel: "onEpochEnd", epoch, logs });
            },
        },
    });
    await model.save("indexeddb://nb-batch-run-1");
    await tf.setBackend("webgl");
    const model1 = (await tf.loadLayersModel("indexeddb://nb-batch-run-1")) as tf.Sequential;
    return model1;
}
