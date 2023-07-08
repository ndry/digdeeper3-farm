import { _never } from "../../utils/_never";
import { run } from "./run";
import * as tf from "@tensorflow/tfjs";


export async function trainModel({
    runArgs,
    batchSize = 5000,
    batchCount = 10,
    log = console.log.bind(console),
    epochs = 1,
    modelToTrain,
}: {
    runArgs: Parameters<typeof run>[0],
    batchSize?: number,
    batchCount?: number,
    log?: (msg: any) => void,
    epochs?: number,
    modelToTrain?: tf.Sequential,
}) {
    console.log({ runArgs });

    const stateLength = run(runArgs).getState().length;
    console.log({ "run(runArgs).getState().length": stateLength });
    const model = tf.sequential();
    model.add(tf.layers.dense({
        units: 250,
        activation: "relu",
        inputShape: [
            stateLength,
        ],
        batchSize,
    }));
    model.add(tf.layers.dense({ units: 175, activation: "relu" }));
    model.add(tf.layers.dense({ units: 250, activation: "relu" }));
    model.add(tf.layers.dense({ units: 250, activation: "relu" }));
    model.add(tf.layers.dense({ units: 250, activation: "relu" }));
    model.add(tf.layers.dense({ units: 250, activation: "relu" }));
    model.add(tf.layers.dense({ units: 4, activation: "softmax" }));

    model.compile({
        optimizer: tf.train.adam(),
        loss: "sparseCategoricalCrossentropy",
        metrics: ["accuracy"],
    });

    if (modelToTrain) {
        model.setWeights(modelToTrain.getWeights());
    }

    await model.fitDataset(
        tf.data.generator(function* () {
            const theRun = run(runArgs);
            for (let i = 0; i < batchCount; i++) {
                const perfStart = performance.now();
                const xs = [];
                const ys = [];
                for (let j = 0; j < batchSize; j++) {
                    const xy = theRun.tick1();
                    if (!xy) { return; }
                    xs.push(xy.state);
                    ys.push(xy.direction);
                }
                const perfEnd = performance.now();
                log({
                    trainModel: "tickCount",
                    tickCount: theRun.tickCount,
                    perf: perfEnd - perfStart,
                });
                yield {
                    xs: tf.tensor(xs),
                    ys: tf.tensor(ys),
                };
            }
        }),
        {
            epochs,
            callbacks: {
                onEpochEnd: (epoch, logs) => {
                    log({ trainModel: "onEpochEnd", epoch, logs });
                },
            },
        },
    );


    // const p = (model.predict(tf.tensor([[0, 1, 1]])) as tf.Tensor)
    // .dataSync();
    // console.log(p);

    return model;
}
