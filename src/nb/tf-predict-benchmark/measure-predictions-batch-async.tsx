import * as tf from "@tensorflow/tfjs";
import { version as caVersion } from "../../ca/version";
import { run } from "../nb-2023-07-06/run";
import { modelUrl } from "./model-url";


export async function measurePredictionsBatchAsync() {
    const backend = "webgl";
    console.log("setting backend to " + backend);
    await tf.setBackend(backend);
    console.log("loading model");
    const model = await tf.loadLayersModel(modelUrl);
    const count = 100;
    const batchSize = 5000;

    const runs = Array.from({ length: batchSize }, (_, i) => run({
        dropzone: {
            code: {
                v: caVersion,
                stateCount: 3,
                rule: "271461095179572113182746752230348630343",
            },
            depthLeftBehind: 100,
            spaceSize: 151,
            seed: 4242,
            startFillState: 0,
            stateMap: [1, 0, 2],
        },
        tickSeed: 4243 + i * 13 * 17,
        copilotModel: undefined,
    }));

    let perf = 0;
    console.log("predicting");
    for (let i = 0; i < count; i++) {

        const perfStart = performance.now();
        const inputs = tf.tensor(runs.map((r) => r.getSight()));
        [...await (model.predict(inputs, { batchSize }) as tf.Tensor).data()];
        const perfEnd = performance.now();
        perf += perfEnd - perfStart;

        for (const theRun of runs) { theRun.tick(); }
    }
    console.log("done");

    return {
        name: "batch async",
        d: new Date().toISOString(),
        p1Us: (perf / count / batchSize * 1000).toFixed(2),
        perfPerOne: perf / count / batchSize,
        count,
        perf,
        batchSize,
    };
}
