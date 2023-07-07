import { run } from "./run";
import * as tf from "@tensorflow/tfjs";


export async function trainModel({ runArgs }: {
    runArgs: Parameters<typeof run>[0];
}) {
    console.log({ runArgs });
    const theRun = run(runArgs);

    const model = tf.sequential();
    model.add(tf.layers.dense({
        units: 250,
        activation: "relu",
        inputShape: [
            theRun.getState().length,
        ],
    }));
    model.add(tf.layers.dense({ units: 175, activation: "relu" }));
    model.add(tf.layers.dense({ units: 150, activation: "relu" }));
    model.add(tf.layers.dense({ units: 3, activation: "softmax" }));

    model.compile({
        optimizer: tf.train.adam(),
        loss: "sparseCategoricalCrossentropy",
        metrics: ["accuracy"],
    });

    if (runArgs.copilotModel) {
        model.setWeights(runArgs.copilotModel.model.getWeights());
    }



    await model.fitDataset(
        tf.data.generator(function* () {
            while (theRun.tickCount < 2e4) {
                if (theRun.tickCount % 1e3 === 0) {
                    console.log({
                        trainModel: "tickCount",
                        tickCount: theRun.tickCount,
                    });
                }
                const xy = theRun.tick1();
                if (!xy) { break; }
                yield {
                    xs: tf.tensor([xy.state]),
                    ys: tf.tensor([xy.direction]),
                };
            }
        }),
        {
            epochs: 1,
            callbacks: {
                onEpochEnd: (epoch, logs) => {
                    console.log({ trainModel: "onEpochEnd", epoch, logs });
                },
            },
        },
    );


    // const p = (model.predict(tf.tensor([[0, 1, 1]])) as tf.Tensor)
    // .dataSync();
    // console.log(p);

    return { model, id: Math.random().toString().slice(2) };
}
