import { ReadonlyDeep } from "../../utils/readonly-deep";
import * as tf from "@tensorflow/tfjs";
import { directionVec } from "./run";


const possibleDirections = [0, 0, 0, 0] as (0 | 1 | 2 | 3)[];

export const neighborhoodRadius = 8;
export const neighborhood = [...(function* () {
    const r = neighborhoodRadius;
    for (let dt = -r; dt <= r; dt++) {
        for (let dx = -r; dx <= r; dx++) {
            if (Math.abs(dt) + Math.abs(dx) <= r) {
                yield [dt, dx] as [number, number];
            }
        }
    }
})()];
export const windowLength = 1;

export const getNeuralWalkerSight = ({
    playerPositionX: px, playerPositionT: pt, atWithBounds,
}: {
    playerPositionX: number;
    playerPositionT: number;
    atWithBounds: (t: number, x: number) => number;
}) => [
        ...neighborhood
            .map(([dx, dt]) => {
                const st = atWithBounds(pt + dt, px + dx);
                return ((st === 0) || (st === 2)) ? 0 : 1;
            }),
        // playerEnergy,
    ];

const cache = new WeakMap<
    ReadonlyDeep<tf.Sequential>,
    Record<string, (readonly [0 | 1 | 2 | 3, number])[]>>();
const getPrediction = (model: ReadonlyDeep<tf.Sequential>, sight: number[]) => {
    // return [...(model.predict([tf.tensor([sight])]) as tf.Tensor).dataSync()];

    let cacheForModel = cache.get(model);
    if (cacheForModel === undefined) {
        cacheForModel = {};
        cache.set(model, cacheForModel);
    }

    const key = sight.join(",");

    if (!(key in cacheForModel)) {
        const inputTensor = tf.tensor([sight]);
        const predictionTensor = model.predict([inputTensor]) as tf.Tensor;
        // console.log({ theOffer });
        const sorted = [...predictionTensor.dataSync()]
            .map((v, i) => [i as 0 | 1 | 2 | 3, v] as const)
            .sort((a, b) => b[1] - a[1]);
        cacheForModel[key] = sorted;
        predictionTensor.dispose();
        inputTensor.dispose();
    }
    return cacheForModel[key];
};

export const getNeuralWalkerStep = (env: ReadonlyDeep<{
    stateCount: number;
    playerPositionX: number;
    playerPositionT: number;
    atWithBounds: (t: number, x: number) => number;
    random32: () => number;
    model: tf.Sequential;
}>) => {
    const {
        stateCount,
        playerPositionX: px,
        playerPositionT: pt,
        atWithBounds,
        random32,
        model,
    } = env;
    possibleDirections.length = 0;
    for (let _d = 0; _d < 4; _d++) {
        const d = _d as 0 | 1 | 2 | 3;
        const nx = px + directionVec[d][0];
        const nt = pt + directionVec[d][1];
        const s = atWithBounds(nt, nx);
        if (s === stateCount + 1) { continue; } // bounds
        if (s === 1) { continue; } // wall



        // visited | empty | energy
        possibleDirections.push(d);
    }

    if (possibleDirections.length === 0) {
        throw new Error("Game over: No possible directions");
    }

    let direction: 0 | 1 | 2 | 3 | undefined = undefined;

    const sorted = getPrediction(model, getNeuralWalkerSight(env));
    for (const [i, v] of sorted) {
        if (!possibleDirections.includes(i)) { continue; }
        // if (v < 0.5) { break; }
        // const p = 1 - (1 - v) ** 2;
        const p = v;
        const r01 = random32() / 4294967296;
        if (r01 < p) {
            direction = i;
            break;
        }
    }
    direction ??=
        possibleDirections[random32() % possibleDirections.length];
    return direction as 0 | 1 | 2 | 3;
};
