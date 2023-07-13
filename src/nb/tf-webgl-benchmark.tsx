import { useState } from "react";
import { retroThemeCss } from "./nb-2023-07-06/retro-theme-css";
import { trainModel } from "./nb-2023-07-06/train-model";
import { version as caVersion } from "../ca/version";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";
import "@tensorflow/tfjs-backend-webgpu";
import { setWasmPaths } from '@tensorflow/tfjs-backend-wasm';
setWasmPaths("https://unpkg.com/@tensorflow/tfjs-backend-wasm@4.8.0/dist/");
import { useControls } from "leva";

export default function App() {
    const [logs, setLogs] = useState<{
        msg: any,
        time: Date,
    }[]>([{
        msg: "init",
        time: new Date(),
    }]);
    const log = (msg: any) => {
        setLogs(l => [...l, {
            msg,
            time: new Date(),
        }]);
        console.log(msg);
    };
    const {
        batchSize,
        batchCount,
        backend,
    } = useControls({
        batchSize: { value: 5000, min: 1000, max: 50000, step: 1000 },
        batchCount: { value: 10, min: 1, max: 1000, step: 1 },
        backend: {
            value: "webgl",
            options: ["cpu", "webgl", "wasm", "webgpu"],
        },
    });
    const [result, setResult] = useState([] as any[]);
    return <div css={[{
        fontSize: "0.7em",
        display: "flex",
        flexDirection: "column",
        padding: "1em",
    }, retroThemeCss]}>
        <div css={{
            fontSize: "2em",
        }}>
            {result.map((r, i) => <div key={i}>
                RESULT {i}: {JSON.stringify(r)};
            </div>)}
            <button onClick={async () => {
                const perfStart = performance.now();
                log({
                    perf: performance.now() - perfStart,
                    msg: "setting backend",
                    backend,
                });
                await tf.setBackend(backend);
                log({
                    perf: performance.now() - perfStart,
                    msg: "backend set, starting training",
                    batchSize,
                    batchCount,
                });
                const dropzone = {
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
                } as const;
                await trainModel({
                    log: (msg) => log({
                        perf: performance.now() - perfStart,
                        msg,
                    }),
                    runArgs: {
                        dropzone,
                        tickSeed: 4243,
                        copilotModel: undefined,
                    },
                    batchSize,
                    batchCount,
                });
                log({
                    perf: performance.now() - perfStart,
                    msg: "training complete",
                    RESULT_MS: performance.now() - perfStart,
                });
                setResult(r => [
                    ...r, {
                        perf: performance.now() - perfStart,
                        backend,
                        batchSize,
                        batchCount,
                    },
                ]);
            }}>run</button>
        </div>
        <br />
        <div>
            {logs.map(({ msg, time }, i) => <div key={i}>
                {time.toISOString()}
                &nbsp;&nbsp;&nbsp;
                {typeof msg === "string" ? msg : JSON.stringify(msg)}
            </div>)}
        </div>
        <button onClick={() => setLogs([])}>clear logs</button>
    </div>;
}