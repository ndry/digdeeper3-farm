import * as tf from "@tensorflow/tfjs-node";
import { v2 } from "./utils/v";
import { tuple } from "./utils/tuple";


export const neighborhood = [...(function* () {
    const r = 4;
    for (let dt = -2; dt <= 2; dt++) {
        for (let dx = -2; dx <= 2; dx++) {
            if (Math.abs(dt) + Math.abs(dx) <= r) {
                yield [dt, dx] as v2;
            }
        }
    }
})()];
export const windowLength = 1;

// export const neighborhood = [
//     [-1, 0],
//     [0, -1], [0, 0], [0, 1],
//     [1, 0],
// ];
// export const windowLength = 2;

export const initStates = () => {
    return Array.from(
        { length: windowLength },
        () => [
            ...neighborhood.flatMap(() => [0, 0, 0, 0]),
            0,
        ],
    );
}

/**
 * @mutates neighborhoodStates
 */
export const processStep = (
    neighborhoodStates: number[][],
    playerPosition: v2,
    playerEnergy: number,
    /** Should return stateCount + 1 for out of bounds */
    atWithBounds: (t: number, x: number) => number,
    instruction: 0 | 1 | 2 | 3, // move direction 
) => {
    const state = [
        ...neighborhood
            .flatMap(([dx, dt]) => {
                const st = atWithBounds(playerPosition[1] + dt, playerPosition[0] + dx);
                return [
                    st === 0 ? 1 : 0,
                    st === 1 ? 1 : 0,
                    st === 2 ? 1 : 0,
                    st === 3 ? 1 : 0, // bounds
                ];
            }),
        playerEnergy,
    ];
    neighborhoodStates.push(state);
    neighborhoodStates.splice(0, neighborhoodStates.length - windowLength);
    return tuple(
        neighborhoodStates.flatMap(x => x),
        instruction,
    );
}

export const train = async (
    _model: tf.Sequential | undefined,
    data: [number[], number][],
) => {
    const model = tf.sequential();
    model.add(tf.layers.dense({
        units: 250,
        activation: 'relu',
        inputShape: [
            (neighborhood.length * 4 + 1) * windowLength,
        ]
    }));
    model.add(tf.layers.dense({ units: 175, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 150, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 4, activation: 'softmax' }));

    model.compile({
        optimizer: tf.train.adam(),
        loss: 'sparseCategoricalCrossentropy',
        metrics: ['accuracy']
    });

    if (_model) {
        model.setWeights(_model.getWeights());
    }

    await model.fit(
        tf.tensor(data.map(([x, y]) => x)),
        tf.tensor(data.map(([x, y]) => y)),
        {
            epochs: 15,
        }
    )

    return model;
}