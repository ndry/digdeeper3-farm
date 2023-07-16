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
import { createBatchRunScheduler } from "./create-batch-run-scheduler";
import { jsx } from "@emotion/react";

const readMeasuresAndClear = (...names: string[]) => {
    const toMyStr = (n: number) => {
        let m = Math.floor(Math.log10(n));
        m = Math.floor(m / 3) * 3;
        const s1 = n.toFixed(2).padStart(6, "\u00B7");
        if (m === 0) { return s1.padEnd(10, "\u00B7"); }
        return (s1 + "e" + m).padEnd(10, "\u00B7");
    };

    const acc = names.reduce((acc, name) => {
        const measures = performance
            .getEntriesByName(name, "measure")
            .reduce((acc, m) => {
                acc.name = m.name;
                acc.totalDuraation += m.duration;
                acc.count++;
                return acc;
            }, {
                name: "",
                totalDuraation: 0,
                count: 0,
            });
        performance.clearMeasures(name);
        const averageDuration = measures.totalDuraation / measures.count;
        acc.avgs[name] = toMyStr(averageDuration);
        acc.infos[name] = {
            avg: toMyStr(averageDuration),
            td: toMyStr(measures.totalDuraation),
            c: measures.count,
        };
        return acc;
    }, {
        avgs: {} as Record<string, string>,
        infos: {} as Record<string, any>,
    });
    return {
        ...acc.avgs,
        __infos: acc.infos,
    };
};

const scale = 1;
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
const neuralWalkerBatchCount = 5;
const neuralWalkerBatchSize = 300;
const totalRandomWalkers = 500;
const totalRandomWalkersOnStart = 1000;



export function BatchRunViewHeader({
    ...props
}: jsx.JSX.IntrinsicElements["tr"]) {
    return <tr {...props}><th>stepCount</th><th>runs</th></tr>;
}
export function BatchRunViewRow({
    batchRun,
    ...props
}: jsx.JSX.IntrinsicElements["tr"] & {
    batchRun: ReadonlyDeep<ReturnType<typeof createBatchRun>>,
}) {
    return <tr {...props}>
        <td>{batchRun.stepCount}</td>
        <td>{batchRun.runs.length}</td>
    </tr>;
}

export default function App() {
    const [renderTrigger, setRenderTrigger] = useState(0);
    const [generationNum, setGenerationNum] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const perfRef = useRef<HTMLSpanElement>(null);

    const [batchRuns, setBatchRuns] = useState(() => [
        createBatchRunScheduler(createBatchRun({
            dropzone,
            runArgss: Array.from({
                length: totalRandomWalkersOnStart,
            }, (_, i) => ({
                tickSeed: +new Date() + i * 13 * 17,
                copilotModel: undefined,
                stepRecorder: new Uint8Array(runLength),
            })),
        })),
    ]);


    useEffect(() => {
        if (isRunning) { return; }
        if (!autoLoop) { return; }
        if (batchRuns[0].batchRun.stepCount !== 0) { return; }
        setIsRunning(true);
    }, [batchRuns, isRunning, autoLoop]);

    useLayoutEffect(() => {
        if (!isRunning) { return; }

        Promise.all(batchRuns.map(batch => batch.start()));

        const lastSteps = batchRuns.map(batch => batch.batchRun.stepCount);
        const runCount = batchRuns.reduce((sum, batch) =>
            sum + batch.batchRun.runs.length, 0);
        const targetDt = 1000 / targetSbps;

        // let emaSps = undefined as number | undefined;
        // let accDt = 0;
        // let accSteps = 0;
        // let lastNow = undefined as number | undefined;

        const handle = setInterval(async () => {
            // const now = performance.now();
            // if (lastNow !== undefined) {

            //     const actualDt = now - lastNow;
            //     accDt += actualDt;
            //     accSteps += stepsCount;
            //     stepsCount = stepsCount ** (Math.log(targetDt * 0.9) / Math.log(actualDt));

            //     const actualSps = stepsCount / actualDt * 1000;
            //     emaSps = (emaSps ?? actualSps) * 0.95 + actualSps * 0.05;

            //     if (accDt > (1000 / targetRrps)) {

            //         console.log(readMeasuresAndClear(
            //             ...batchRuns
            //                 .map((_, i) => i)
            //                 .filter(i => i > 0) // skip randoms
            //                 .flatMap(id => [
            //                     // `${id}_100-200`,
            //                     `${id}_100-400`,
            //                     `${id}_500-900`,
            //                     `${id}_100-900`,
            //                 ])));

            //         const spsAcc = accSteps / accDt * 1000;
            //         console.log({
            //             actualDt, targetDt, stepsCount, actualSps,
            //             emaSps, accDt, accSteps, spsAcc,
            //         });
            //         if (perfRef.current) {
            //             perfRef.current.innerText =
            //                 `sps: ema ${emaSps.toFixed(0)}`
            //                 + ` / acc ${spsAcc.toFixed(0)}`
            //                 + ` / mom     ${actualSps.toFixed(0)}`
            //                 + `\nrsps: ema ${(emaSps * runCount).toExponential(1)}`
            //                 + ` / racc ${(spsAcc * runCount).toExponential(1)}`
            //                 + ` / rmom     ${(actualSps * runCount).toExponential(1)}`;
            //         }
            setRenderTrigger(t => t + 1);
            //         accDt = 0;
            //         accSteps = 0;
            //     }
            // }
            // lastNow = now;
        }, targetDt);
        return () => {
            clearInterval(handle);
            Promise.all(batchRuns.map(batch => batch.stop()));
        };
    }, [batchRuns, isRunning, targetSbps]);

    const bestRuns = sortedSlice(
        function* () { for (const batch of batchRuns) { yield* batch.batchRun.runs; } }(),
        (a, b) => b.run.maxDepth - a.run.maxDepth,
        0, tableSize);

    useEffect(() => {
        if (!isRunning) { return; }
        if (!autoLoop) { return; }
        if (
            batchRuns[0].batchRun.stepCount
            < (batchRuns[0].batchRun.runs[0].runArgs.stepRecorder?.length ?? Infinity)
        ) { return; }
        setIsRunning(false);
        (async () => {
            const bestRunsCount = 10;
            const bestRuns = sortedSlice(
                function* () { for (const batch of batchRuns) { yield* batch.batchRun.runs; } }(),
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
            >)).reverse();
            const models = [
                {
                    id: (+new Date()).toString() + "g"
                        + generationNum.toString().padStart(2, "0"),
                    model,
                },
                ...bestModels,
            ];
            setBatchRuns([
                ...Array.from({
                    length: neuralWalkerBatchCount,
                }, (_, i) => createBatchRunScheduler(createBatchRun({
                    dropzone,
                    copilotModel: models[i % models.length],
                    runArgss: Array.from({
                        length: neuralWalkerBatchSize,
                    }, (_, j) => ({
                        tickSeed: +new Date() + j * 13 * 17 + i * 143,
                        stepRecorder: new Uint8Array(runLength),
                    })),
                    perfId: "n" + i,
                }))),
                createBatchRunScheduler(createBatchRun({
                    dropzone,
                    runArgss: Array.from({
                        length: totalRandomWalkers,
                    }, (_, i) => ({
                        tickSeed: +new Date() + i * 13 * 17,
                        copilotModel: undefined,
                        stepRecorder: new Uint8Array(runLength),
                    })),
                    perfId: "r0",
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
                <table>
                    <thead>
                        <BatchRunViewHeader />
                    </thead>
                    <tbody>
                        {batchRuns.map((batchRunSheduler, i) =>
                            <BatchRunViewRow
                                key={i}
                                batchRun={batchRunSheduler.batchRun}
                            />)}
                    </tbody>
                </table>
                renderTrigger: {renderTrigger}
                <br />
                generation: {generationNum}
                <table css={[{
                    textAlign: "right",
                    borderSpacing: "0px",
                },
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
                    batchRuns.reduce((sum, batch) => sum + batch.batchRun.runs.length, 0)
                }
            </div>
        </div>
    </div >;
}
