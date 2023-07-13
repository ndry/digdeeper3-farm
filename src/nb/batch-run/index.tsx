import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { retroThemeCss } from "../nb-2023-07-06/retro-theme-css";
import { createBatchRun } from "./batch-run";
import { version as caVersion } from "../../ca/version";
import { useControls } from "leva";
import { DropStateView } from "./drop-state-view";
import { sortedSlice } from "../../utils/sorted-slice";
import { _never } from "../../utils/_never";

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
const runLength = 25_000;
const tableSize = 30;


export default function App() {
    const [renderTrigger, setRenderTrigger] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const perfRef = useRef<HTMLSpanElement>(null);

    const runs = useMemo(() => [
        createBatchRun({
            dropzone,
            runArgss: Array.from({ length: 1000 }, (_, i) => ({
                tickSeed: +new Date() + i * 13 * 17,
                copilotModel: undefined,
                stepRecorder: new Uint8Array(runLength),
            })),
        })
    ], []);

    useLayoutEffect(() => {
        if (!isRunning) { return; }
        const targetDt = 1000 / targetSbps;
        let lastDt = targetDt;
        let lastSteps = 100;
        let emaSps = undefined as number | undefined;
        let accDt = 0;
        let accSteps = 0;

        const handle = setInterval(() => {
            lastSteps = Math.max(1, lastSteps * ((targetDt * 0.9) / lastDt));
            const perfStart = performance.now();

            for (let i = 0; i < lastSteps; i++) {
                for (const run of runs) { run.step(); }
            }

            const perfEnd = performance.now();
            lastDt = perfEnd - perfStart;
            accDt += lastDt;
            accSteps += lastSteps;


            if (accDt > (1000 / targetRrps)) {
                const lastSps = lastSteps / lastDt * 1000;
                emaSps = (emaSps ?? lastSps) * 0.95 + lastSps * 0.05;
                const spsAcc = accSteps / accDt * 1000;
                console.log({
                    lastDt, lastSteps, lastSps,
                    emaSps, accDt, accSteps, spsAcc,
                });
                if (perfRef.current) {
                    perfRef.current.innerText =
                        `sps: ema ${emaSps.toFixed(0)}`
                        + ` / acc ${spsAcc.toFixed(0)}`
                        + ` / mom     ${lastSps.toFixed(0)}`;
                }
                setRenderTrigger(t => t + 1);
                accDt = 0;
                accSteps = 0;
            }
        }, targetDt);
        return () => clearInterval(handle);
    }, [runs, isRunning, targetSbps]);

    const bestRuns = sortedSlice(
        function* () { for (const batch of runs) { yield* batch.runs; } }(),
        (a, b) => a.run.maxDepth - b.run.maxDepth,
        0, tableSize);

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
                            <th>......tickSeed</th>
                            <th>..model</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bestRuns.map((entry, i) => {
                            const { runArgs, run, batch } = entry;
                            const { tickSeed } = runArgs;
                            const { copilotModel } = batch.args;
                            const { maxDepth, speed } = run;
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
                                <td>{tickSeed}</td>
                                <td>
                                    {copilotModel
                                        ? copilotModel.id
                                        : "-"}
                                </td>
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
