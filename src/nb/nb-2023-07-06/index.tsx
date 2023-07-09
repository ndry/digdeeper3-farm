import { useControls } from "leva";
import { run } from "./run";
import { version as caVersion } from "../../ca/version";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import jsonBeautify from "json-beautify";
import { RunSightView } from "./RunSightView";
import { createModel, trainModel } from "./trainModel";
import * as tf from "@tensorflow/tfjs";
import { setWasmPaths } from "@tensorflow/tfjs-backend-wasm";
setWasmPaths("https://unpkg.com/@tensorflow/tfjs-backend-wasm@4.8.0/dist/");
import "@tensorflow/tfjs-backend-webgpu";
import "@tensorflow/tfjs-backend-webgl";
import { retroThemeCss } from "./retro-theme-css";
import update from "immutability-helper";
import { _never } from "../../utils/_never";
import { ReadonlyDeep } from "../../utils/readonly-deep";


export default function App() {
    const [renderTrigger, setRenderTrigger] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [selectedRunIndex, setSelectedRunIndex] = useState(0);
    const [models, setModels] = useState<Array<{
        model: ReadonlyDeep<tf.Sequential>,
        id: string,
    }>>([]);
    const perfRef = useRef<HTMLSpanElement>(null);

    function step(ticks: number) {
        for (const run of runs) {
            for (let i = 0; i < ticks; i++) {
                run.run.tick();
            }
        }
        setRenderTrigger(t => t + 1);
    }

    const {
        seed,
        scale,
        spaceSize,
        runCount,
        firstRunCountFactor,
        batchSize,
        batchCount,
        targetFps,
    } = useControls({
        seed: { value: 4245, min: 1, max: 0xffffffff, step: 1 },
        scale: { value: 2, min: 1, max: 10, step: 1 },
        spaceSize: { value: 201, min: 2, max: 1000, step: 1 },
        runCount: { value: 80, min: 1, max: 2000, step: 1 },
        firstRunCountFactor: { value: 20, min: 1, max: 200, step: 1 },
        batchSize: { value: 5000, min: 1, max: 100000, step: 1 },
        batchCount: { value: 5, min: 1, max: 1000, step: 1 },
        targetFps: { value: 15, min: 0.1, max: 120, step: 0.1 },
    });

    const runLength = batchCount * batchSize;

    const { runs } = useMemo(() => {
        const dropzone = {
            code: {
                v: caVersion,
                stateCount: 3,
                rule: "271461095179572113182746752230348630343",
            },
            depthLeftBehind: 100,
            spaceSize,
            seed,
            startFillState: 0,
            stateMap: [1, 0, 2],
        } as const;
        const runs = Array.from({
            length: models.length > 0
                ? runCount
                : (firstRunCountFactor * runCount),
        }, (_, i) => ({
            i,
            run: run({
                dropzone,
                tickSeed: seed + i * 10000 + i * 2,
                copilotModel: (i > runCount * 0.75)
                    ? models[i % models.length]
                    : undefined,
                stepRecorder: new Uint8Array(runLength),
            }),
        }));

        return {
            runs,
        };
    }, [seed, spaceSize, runCount, models, runLength]);

    useLayoutEffect(() => {
        if (!isRunning) { return; }
        const targetDt = 1000 / targetFps;
        let lastDt = targetDt;
        let lastTicks = 100;
        let perf = 0;

        const handle = setInterval(() => {
            lastTicks = Math.max(1, lastTicks * (targetDt / lastDt));
            const perfStart = performance.now();
            step(lastTicks);
            const perfEnd = performance.now();
            lastDt = perfEnd - perfStart;
            console.log({ "tick + setRenderTrigger": lastDt, lastTicks });
            if (
                runs[0].run.stepCount
                >= (runs[0].run.args.stepRecorder?.length ?? Infinity)
            ) {
                setIsRunning(false);
            }
            const lastPerf = lastTicks / lastDt * 1000;
            perf = perf * 0.95 + lastPerf * 0.05;
            if (perfRef.current) {
                perfRef.current.innerText =
                    `${perf.toFixed(2)} (${lastPerf.toFixed(2)}) tps`;
            }
        }, targetDt * 1.1);
        return () => clearInterval(handle);
    }, [runs, isRunning, targetFps]);
    const selectedRunWithNum = runs[selectedRunIndex];

    const sortedRuns = [...runs]
        .sort((a, b) =>
            (b.run.stats.maxDepth - a.run.stats.maxDepth)
            || (b.run.stats.speed - a.run.stats.speed));

    return <div css={[{
        fontSize: "0.7em",

        display: "flex",
        flexDirection: "column",
    }, retroThemeCss]}>
        <div css={{
            display: "flex",
            flexDirection: "row",
        }}>
            <RunSightView
                css={{ padding: "1px" }}
                run1={sortedRuns[0].run}
                scale={scale}
            />
            {selectedRunWithNum && <RunSightView
                css={{ padding: "1px" }}
                run1={selectedRunWithNum.run}
                scale={scale}
            />}
            <div>
                <span ref={perfRef}>%tps%</span>
                <br />
                <button onClick={() => setIsRunning(!isRunning)}>
                    {isRunning ? "pause" : "play"}
                </button>
                &nbsp;
                {!isRunning && <>
                    <button
                        onClick={() => step(1000)}
                    >step</button>
                    &nbsp;
                </>}
                <br />
                renderTrigger: {renderTrigger} / stepCount: {runs[0].run.stats.stepCount}
                <div css={{
                    overflow: "auto",
                    height: "600px",
                }}>
                    <table css={[{
                        textAlign: "right",
                        borderSpacing: "0px",
                    },
                /*css*/"& tr:nth-of-type(2n) { background: rgba(0, 255, 17, 0.07);}",
                    ]}>
                        <thead>
                            <tr>
                                <th>..run</th>
                                <th>.maxDepth</th>
                                <th>...speed</th>
                                <th>.tickSeed</th>
                                <th>.......model</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedRuns
                                .slice(0, runCount)
                                .map(({ run, i }) => {
                                    const { args, stats } = run;
                                    const {
                                        tickSeed,
                                        copilotModel
                                    } = run.args;
                                    const {
                                        maxDepth,
                                        speed,
                                    } = stats;
                                    return <tr
                                        key={i}
                                        css={[{
                                            background: selectedRunIndex === i
                                                ? "#00ff1140"
                                                : "transparent",
                                            cursor: "pointer",
                                        }, /*css*/" &:hover { background: #00ff1160; }"]}

                                        onClick={() => {
                                            setSelectedRunIndex(i);
                                            console.log({ i, run, args, stats });
                                        }}
                                    // todo: do not stringify the data arrays
                                    // title={jsonBeautify({ args, stats }, null as any, 2, 80)}
                                    >
                                        <td>{i}</td>
                                        <td
                                            css={{
                                                background:
                                                    maxDepth === selectedRunWithNum?.run.stats.maxDepth
                                                        ? "rgba(47, 255, 0, 0.13)"
                                                        : "transparent",
                                            }}
                                        >{maxDepth}</td>
                                        <td>{speed.toExponential(2)}</td>
                                        <td>{tickSeed}</td>
                                        <td>
                                            {copilotModel
                                                ? copilotModel.id
                                                : "-"}
                                        </td>
                                    </tr>;
                                })}
                            {sortedRuns.length > runCount && <tr><td>...</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        <button
            onClick={async () => {
                if (!selectedRunWithNum) { return; }
                // await tf.setBackend("webgpu");
                // await tf.setBackend("wasm");
                const modelExists = !!selectedRunWithNum.run.args.copilotModel;

                const { args } = selectedRunWithNum.run;
                await args.copilotModel?.model.save("indexeddb://nb-2023-07-06-1");
                await tf.setBackend("webgl");
                const model = modelExists
                    ? (await tf.loadLayersModel("indexeddb://nb-2023-07-06-3")) as tf.Sequential
                    : createModel({
                        stateLength: selectedRunWithNum.run.getSight().length,
                        batchSize,
                    });
                await trainModel({
                    runArgs: update(args, {
                        recordedSteps: { $set: args.stepRecorder ?? _never() },
                        stepRecorder: { $set: undefined },
                    }),
                    batchSize,
                    batchCount,
                    epochs: 10,
                    modelToTrain: model,
                });
                await model.save("indexeddb://nb-2023-07-06-1");
                await tf.setBackend("wasm");
                setModels([{
                    model: (await tf.loadLayersModel("indexeddb://nb-2023-07-06-1")) as tf.Sequential,
                    id: Math.random().toString().slice(2),
                }, ...models].slice(0, 3));

            }}
            disabled={!selectedRunWithNum}
        >
            train on selected run
            {selectedRunWithNum && ` (${selectedRunWithNum.i}/ts-${selectedRunWithNum.run.args.tickSeed})`}
        </button>
        <br />
        <button
            onClick={async () => {
                const bestRuns = sortedRuns.slice(0, 10).reverse();
                const bestRun = bestRuns[bestRuns.length - 1];
                const modelExists = !!bestRun.run.args.copilotModel;

                await bestRun.run.args.copilotModel?.model.save("indexeddb://nb-2023-07-06-3");
                await tf.setBackend("webgl");
                const model = modelExists
                    ? (await tf.loadLayersModel("indexeddb://nb-2023-07-06-3")) as tf.Sequential
                    : createModel({
                        stateLength: bestRun.run.getSight().length,
                        batchSize,
                    });
                for (let i = 0; i < bestRuns.length; i++) {
                    const args = bestRuns[i].run.args;
                    await trainModel({
                        runArgs: update(args, {
                            recordedSteps: {
                                $set: args.stepRecorder ?? _never(),
                            },
                            stepRecorder: { $set: undefined },
                        }),
                        batchSize,
                        batchCount,
                        epochs: 1,
                        modelToTrain: model,
                    });
                }
                await model.save("indexeddb://nb-2023-07-06-3");
                await tf.setBackend("wasm");
                setModels([{
                    model: (await tf.loadLayersModel("indexeddb://nb-2023-07-06-3")) as tf.Sequential,
                    id: Math.random().toString().slice(2, 6),
                }, ...models].slice(0, 3));
            }}
        >
            train on 10 best runs
        </button>
    </div >;
}