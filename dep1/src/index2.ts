import * as tf from "@tensorflow/tfjs-node";

(async () => {

    const data = [
        [[1, 1, 0], 0],
        [[1, 0, 1], 1],
        [[0, 1, 1], 2],
        [[0, 0, 0], 0],
        [[0, 1, 0], 0],
        [[0, 0, 1], 1],
        [[0, 1, 1], 2],
        [[1, 0, 0], 0],

    ] as [number[], number][];

    const model = tf.sequential();
    model.add(tf.layers.dense({
        units: 250,
        activation: 'relu',
        inputShape: [
            data[0][0].length,
        ]
    }));
    model.add(tf.layers.dense({ units: 175, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 150, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 3, activation: 'softmax' }));

    model.compile({
        optimizer: tf.train.adam(),
        loss: 'sparseCategoricalCrossentropy',
        metrics: ['accuracy']
    });


    const numTrainingIterations = 1;
    for (var i = 0; i < numTrainingIterations; i++) {
        console.log(`Training iteration : ${i + 1} / ${numTrainingIterations}`);
        await model.fit(
            tf.tensor(data.map(([x, y]) => x)),
            tf.tensor(data.map(([x, y]) => y)),
            {
                epochs: 100,
            }
        )
    }


    console.log((
        model.predict(tf.tensor([[0, 1, 1]])) as tf.Tensor)
        .dataSync());
    console.log((
        model.predict(tf.tensor([[0, 1, 1]])) as tf.Tensor)
        .dataSync());
    console.log((
        model.predict(tf.tensor([[0, 1, 1]])) as tf.Tensor)
        .dataSync());
    console.log((
        model.predict(tf.tensor([[0, 1, 1]])) as tf.Tensor)
        .dataSync());

})();