import * as tf from "@tensorflow/tfjs";
import { version as caVersion } from "../../ca/version";
import { run } from "../nb-2023-07-06/run";
import { modelUrl } from "./model-url";


export async function measurePredictionsBasic() {
    console.log("setting backend to wasm");
    await tf.setBackend("wasm");
    console.log("loading model");
    const model = await tf.loadLayersModel(modelUrl);
    const count = 50000;

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
    for (let i = 0; i < count; i++) {

        const perfStart = performance.now();
        [...(model.predict([
            tf.tensor([theRun.getSight()]),
        ]) as tf.Tensor).dataSync()];
        const perfEnd = performance.now();
        perf += perfEnd - perfStart;

        theRun.tick();
    }
    console.log("done");

    return {
        name: "basic",
        d: new Date().toISOString(),
        p1Us: (perf / count * 1000).toFixed(2),
        perfPerOne: perf / count,
        count,
        perf,
    };
}
