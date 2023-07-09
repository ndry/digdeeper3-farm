import * as tf from "@tensorflow/tfjs";
import { version as caVersion } from "../../ca/version";
import { run } from "../nb-2023-07-06/run";
import { modelUrl } from "./model-url";


export async function measurePredictionsNaiveCache() {
    console.log("setting backend to wasm");
    await tf.setBackend("wasm");
    console.log("loading model");
    const model = await tf.loadLayersModel(modelUrl);
    const count = 100000;

    let perf = 0;
    const theRun = run({
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
        tickSeed: 4243,
        copilotModel: undefined,
    });
    console.log("predicting");
    const cache = {} as Record<string, number[]>;
    for (let i = 0; i < count; i++) {

        const perfStart = performance.now();
        const sight = theRun.getSight();
        const sightKey = sight.join(",");
        cache[sightKey] ??= [...(model.predict([
            tf.tensor([theRun.getSight()]),
        ]) as tf.Tensor).dataSync()];
        const perfEnd = performance.now();
        perf += perfEnd - perfStart;

        theRun.tick();
    }
    console.log("done");

    return {
        name: "naive cache",
        d: new Date().toISOString(),
        p1Us: (perf / count * 1000).toFixed(2),
        perfPerOne: perf / count,
        count,
        perf,
        valuesInCache: Object.keys(cache).length,
        valuesInCachePerOne: Object.keys(cache).length / count,
    };
}


// got x2 vs basic with ~50% cache hit rate
// so, maive cache is overwhemingly more performant than the predict