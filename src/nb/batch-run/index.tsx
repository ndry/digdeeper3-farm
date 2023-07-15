/* eslint-disable max-nested-callbacks */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { retroThemeCss } from "../nb-2023-07-06/retro-theme-css";
import { createBatchRun } from "./batch-run";
import { version as caVersion } from "../../ca/version";
import { useControls } from "leva";
import { DropStateView } from "./drop-state-view";
import { sortedSlice } from "../../utils/sorted-slice";
import { _never } from "../../utils/_never";
import { trainOnRuns } from "./train-on-runs";
import { ReadonlyDeep } from "../../utils/readonly-deep";

const scale = 2;
const targetSbps = 15; // step batches per second
const targetRrps = 2; // react renders per second
const dropzone = {
    code: {
        v: caVersion,
        stateCount: 3,
        rule: "271461095179572113182746752230348630343",
    },
    depthLeftBehind: 100,
    spaceSize: 201,
    seed: 4245,
    startFillState: 0,
    stateMap: [1, 0, 2],
} as const;
const trainBatchSize = 5000;
const trainBatchCount = 1;
const runLength = trainBatchCount * trainBatchSize;
const tableSize = 30;
const autoLoop = true;
const totalRandomWalkers = 500;
const totalRandomWalkersOnStart = 1000;
const totalNeuralWalkers = 100;


export default function App() {
    const [renderTrigger, setRenderTrigger] = useState(0);
    const [generationNum, setGenerationNum] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const perfRef = useRef<HTMLSpanElement>(null);

    const [runs, setRuns] = useState(() => [
        createBatchRun({
            dropzone,
            runArgss: Array.from({
                length: totalRandomWalkersOnStart,
            }, (_, i) => ({
                tickSeed: +new Date() + i * 13 * 17,
                copilotModel: undefined,
                stepRecorder: new Uint8Array(runLength),
            })),
        }),
    ]);


    useEffect(() => {
        if (isRunning) { return; }
        if (!autoLoop) { return; }
        if (runs[0].stepCount !== 0) { return; }
        setIsRunning(true);
    }, [runs, isRunning, autoLoop]);

    useLayoutEffect(() => {
        if (!isRunning) { return; }
        const runCount =
            runs.reduce((sum, batch) => sum + batch.runs.length, 0);
        const targetDt = 1000 / targetSbps;
        let stepsCount = 10;

        let emaSps = undefined as number | undefined;
        let accDt = 0;
        let accSteps = 0;
        let lastNow = undefined as number | undefined;

        const step = () => {
            for (let i = 0; i < Math.max(1, stepsCount); i++) {
                for (const run of runs) { run.step(); }
            }

            const now = performance.now();
            if (lastNow !== undefined) {
                const actualDt = now - lastNow;
                accDt += actualDt;
                accSteps += stepsCount;
                stepsCount = stepsCount ** (Math.log(targetDt * 0.9) / Math.log(actualDt));

                const actualSps = stepsCount / actualDt * 1000;
                emaSps = (emaSps ?? actualSps) * 0.95 + actualSps * 0.05;

                if (accDt > (1000 / targetRrps)) {
                    const spsAcc = accSteps / accDt * 1000;
                    console.log({
                        actualDt, targetDt, stepsCount, actualSps,
                        emaSps, accDt, accSteps, spsAcc,
                    });
                    if (perfRef.current) {
                        perfRef.current.innerText =
                            `sps: ema ${emaSps.toFixed(0)}`
                            + ` / acc ${spsAcc.toFixed(0)}`
                            + ` / mom     ${actualSps.toFixed(0)}`
                            + `\nrsps: ema ${(emaSps * runCount).toExponential(1)}`
                            + ` / racc ${(spsAcc * runCount).toExponential(1)}`
                            + ` / rmom     ${(actualSps * runCount).toExponential(1)}`;
                    }
                    setRenderTrigger(t => t + 1);
                    accDt = 0;
                    accSteps = 0;
                }

                handle = setTimeout(step, targetDt * 0.1);
            } else {
                handle = setTimeout(step, targetDt);
            }
            lastNow = now;

        };

        let handle = undefined as ReturnType<typeof setTimeout> | undefined;
        step();
        return () => clearInterval(handle);
    }, [runs, isRunning, targetSbps]);

    const bestRuns = sortedSlice(
        function* () { for (const batch of runs) { yield* batch.runs; } }(),
        (a, b) => b.run.maxDepth - a.run.maxDepth,
        0, tableSize);

    useEffect(() => {
        if (!isRunning) { return; }
        if (!autoLoop) { return; }
        if (
            runs[0].stepCount
            < (runs[0].runs[0].runArgs.stepRecorder?.length ?? Infinity)
        ) { return; }
        setIsRunning(false);
        (async () => {
            const bestRunsCount = 10;
            const bestRuns = sortedSlice(
                function* () { for (const batch of runs) { yield* batch.runs; } }(),
                (a, b) => b.run.maxDepth - a.run.maxDepth,
                0, bestRunsCount);
            const model = await trainOnRuns({
                runs: bestRuns,
                batchSize: trainBatchSize,
                batchCount: trainBatchCount,
            });
            const bestModels = Object.values(bestRuns.reduce((acc, run) => {
                const m = run.batch.args.copilotModel;
                if (!m) { return acc; }
                acc[m.id] = m;
                return acc;
            }, {} as Record<
                string,
                { id: string, model: ReadonlyDeep<typeof model> }
            >));
            const models = [
                {
                    id: (+new Date()).toString() + "g"
                        + generationNum.toString().padStart(2, "0"),
                    model,
                },
                ...bestModels.slice(0, 2),
            ];
            setRuns([
                createBatchRun({
                    dropzone,
                    runArgss: Array.from({
                        length: totalRandomWalkers,
                    }, (_, i) => ({
                        tickSeed: +new Date() + i * 13 * 17,
                        copilotModel: undefined,
                        stepRecorder: new Uint8Array(runLength),
                    })),
                }),
                ...models.map((m, j) => createBatchRun({
                    dropzone,
                    copilotModel: m,
                    runArgss: Array.from({
                        length: Math.floor(totalNeuralWalkers / models.length),
                    }, (_, i) => ({
                        tickSeed: +new Date() + i * 13 * 17 + j * 143,
                        stepRecorder: new Uint8Array(runLength),
                    })),
                })),
            ]);
            setGenerationNum(x => x + 1);
        })().catch(console.error);
    }, [renderTrigger]);

    return <div css={[{
        fontSize: "0.7em",

        display: "flex",
        flexDirection: "column",
        padding: "1em",
    }, retroThemeCss]}>
        <div css={{
            display: "flex",
            flexDirection: "row",
        }}>
            <div>
                {bestRuns[0].batch.args.copilotModel?.id ?? "-"}
                /
                {bestRuns[0].runArgs.tickSeed}:
                <br />
                <DropStateView
                    css={{ padding: "1px" }}
                    dropState={bestRuns[0].run}
                    scale={scale}
                />


                {bestRuns[1].batch.args.copilotModel?.id ?? "-"}
                /
                {bestRuns[1].runArgs.tickSeed}:
                <br />
                <DropStateView
                    css={{ padding: "1px" }}
                    dropState={bestRuns[1].run}
                    scale={scale}
                />
            </div>
            <div>
                <button onClick={() => setIsRunning(!isRunning)}>
                    {isRunning ? "pause" : "play"}
                </button>
                <br />
                <span ref={perfRef}>%sps%</span>
                <br />
                stepCount: {runs[0].stepCount} / {runLength}
                &nbsp;
                ({(runs[0].stepCount / runLength * 100).toFixed(2)}%)
                <br />
                renderTrigger: {renderTrigger}
                <br />
                generation: {generationNum}
                <table css={[{
                    textAlign: "right",
                    borderSpacing: "0px",
                },
        /*css*/"& tr:nth-of-type(2n) { background: rgba(0, 255, 17, 0.07);}",
                ]}>
                    <thead>
                        <tr>
                            <th>...mdp</th>
                            <th>...speed</th>
                            <th>.stepSeed</th>
                            <th>..model</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bestRuns.map((entry, i) => {
                            const { runArgs, run, batch } = entry;
                            const { tickSeed: stepSeed } = runArgs;
                            const { copilotModel } = batch.args;
                            const { maxDepth, speed } = run;
                            const tickSeedColor =
                                "#" + stepSeed.toString(16).slice(-3).padStart(3, "0");
                            const tickSeedStr =
                                stepSeed.toString(6).slice(-6);
                            const modelColor = copilotModel
                                ? "#" + (+copilotModel.id.split("g")[0]).toString(16).slice(-6).padStart(6, "0")
                                : undefined;
                            return <tr
                                key={i}
                                css={[{
                                    // background: selectedRunIndex === i
                                    //     ? "#00ff1140"
                                    //     : "transparent",
                                    cursor: "pointer",
                                }, /*css*/" &:hover { background: #00ff1160; }"]}

                                onClick={() => {
                                    // setSelectedRunIndex(i);
                                    console.log({ i, entry });
                                }}
                            // todo: do not stringify the data arrays
                            // title={jsonBeautify({ args, stats }, null as any, 2, 80)}
                            >
                                <td
                                // css={{
                                //     background:
                                //         maxDepth === selectedRunWithNum?.run.stats.maxDepth
                                //             ? "rgba(47, 255, 0, 0.13)"
                                //             : "transparent",
                                // }}
                                >{maxDepth}</td>
                                <td>{speed.toExponential(2)}</td>
                                <td><span css={{ color: tickSeedColor }}>
                                    {tickSeedStr}
                                </span></td>
                                <td><span css={{ color: modelColor }}>
                                    {copilotModel
                                        ? copilotModel.id.slice(-6)
                                        : "-"}
                                </span></td>
                            </tr>;
                        })}
                    </tbody>
                </table>
                run count: {
                    runs.reduce((sum, batch) => sum + batch.runs.length, 0)
                }
            </div>
        </div>
    </div >;
}
