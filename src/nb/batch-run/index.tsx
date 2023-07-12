import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { retroThemeCss } from "../nb-2023-07-06/retro-theme-css";
import * as tf from "@tensorflow/tfjs";
import { createBatchRun } from "./batch-run";
import { version as caVersion } from "../../ca/version";
import { useControls } from "leva";
import { RunSightView } from "../nb-2023-07-06/RunSightView";
import { DropStateView } from "./drop-state-view";

const scale = 2;
const targetFps = 15;
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

export default function App() {
    const [renderTrigger, setRenderTrigger] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const perfRef = useRef<HTMLSpanElement>(null);

    const runs = useMemo(() => [
        createBatchRun({
            dropzone,
            batch: Array.from({ length: 1000 }, (_, i) => ({
                tickSeed: 4243 + i * 13 * 17,
                copilotModel: undefined,
                stepRecorder: new Uint8Array(runLength),
            })),
        }),
    ], []);

    useLayoutEffect(() => {
        if (!isRunning) { return; }
        const targetDt = 1000 / targetFps;
        let lastDt = targetDt;
        let lastTicks = 100;
        let perf = 0;

        const handle = setInterval(() => {
            lastTicks = Math.max(1, lastTicks * (targetDt / lastDt));
            const perfStart = performance.now();

            for (let i = 0; i < lastTicks; i++) {
                for (const run of runs) { run.step(); }
            }
            setRenderTrigger(t => t + 1);

            const perfEnd = performance.now();
            lastDt = perfEnd - perfStart;
            console.log({ "tick + setRenderTrigger": lastDt, lastTicks });
            const lastPerf = lastTicks / lastDt * 1000;
            perf = perf * 0.95 + lastPerf * 0.05;
            if (perfRef.current) {
                perfRef.current.innerText =
                    `${perf.toFixed(2)} (${lastPerf.toFixed(2)}) tps`;
            }
        }, targetDt * 1.1);
        return () => clearInterval(handle);
    }, [runs, isRunning, targetFps]);

    return <div css={[{
        fontSize: "0.7em",

        display: "flex",
        flexDirection: "column",
        padding: "1em",
    }, retroThemeCss]}>
        Hello!
        <span ref={perfRef}>%tps%</span>
        <br />
        <button onClick={() => setIsRunning(!isRunning)}>
            {isRunning ? "pause" : "play"}
        </button>
        stepCount: {runs[0].stepCount} / {runLength}
        &nbsp;
        ({(runs[0].stepCount / runLength * 100).toFixed(2)}%)
        <br />
        renderTrigger: {renderTrigger}
        <DropStateView
            css={{ padding: "1px" }}
            dropState={runs[0].runs[0].run}
            scale={scale}
        />
    </div>;
}
