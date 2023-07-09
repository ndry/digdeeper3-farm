import usePromise from "react-use-promise";
import { retroThemeCss } from "./nb-2023-07-06/retro-theme-css";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";
import { trainModel } from "./nb-2023-07-06/trainModel";
import { version as caVersion } from "../ca/version";
import { useState } from "react";
import { setWasmPaths } from "@tensorflow/tfjs-backend-wasm";
setWasmPaths("https://unpkg.com/@tensorflow/tfjs-backend-wasm@4.8.0/dist/");

// todo
// benchmark the prediction
// benchmark caching the prediction naively
// benchmark caching the prediction with a custom hasm map

const modelUrl = "indexeddb://tf-predict-benchmark-model-1";

export default function App() {
    const [modelCheckTrigger, setModelCheckTrigger] = useState(0);
    const [modelCheck, modelCheckError, modelCheckStatus] =
        usePromise(async () => {
            await tf.setBackend("wasm");
            const model = await tf.loadLayersModel(modelUrl);
            model.dispose();
        }, [modelCheckTrigger]);


    return <div css={[{
        fontSize: "0.7em",
        padding: "1em",

        display: "flex",
        flexDirection: "column",
    }, retroThemeCss]}>
        {modelCheckStatus === "pending" && <div>Checking model...</div>}
        {modelCheckStatus === "rejected" && <div>
            Model check failed: {modelCheckError.message}
            <br />
            <button onClick={async () => {

                console.log("setting backend to webgl");
                await tf.setBackend("webgl");
                console.log("training model");
                const model = await trainModel({
                    runArgs: {
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
                    },
                    batchSize: 5000,
                    batchCount: 10,
                });
                console.log("saving model");
                model.save(modelUrl);
                console.log("model saved");
                model.dispose();
                setModelCheckTrigger(t => t + 1);
            }}>Train and save a model</button>
        </div>}
        {modelCheckStatus === "resolved" && <div>
            Model is present
        </div>}
    </div>;
}