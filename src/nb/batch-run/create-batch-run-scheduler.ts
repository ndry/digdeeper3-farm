import { ReadonlyDeep } from "../../utils/readonly-deep";
import { createBatchRun } from "./batch-run";

const isPromise = <T>(x: T | Promise<T>): x is Promise<T> =>
    typeof x === "object" && x && "then" in x;

export function createBatchRunScheduler(
    batchRun: ReadonlyDeep<ReturnType<typeof createBatchRun>>,
) {
    const s_2 = "5";

    let isRunning = false;
    let p: Promise<void> | undefined;
    let sps = undefined as number | undefined;
    let ssps = undefined as number | undefined;

    const mainLoop = async () => {
        const startTime = performance.now();
        const startSteps = batchRun.stepCount;
        let lastTime = performance.now();
        let lastSteps = 0;
        sps = undefined;

        while (isRunning) {
            const needRecord = batchRun.args.runArgss.some(x =>
                x.stepRecorder
                && x.stepRecorder.length > batchRun.stepCount);
            if (!needRecord) {
                isRunning = false;
                break;
            }
            const p1 = batchRun.step();
            if (isPromise(p1)) {
                await p1;
            } else {
                const now = performance.now();
                while (performance.now() - now < 1000 / 60) {
                    batchRun.step();
                }

                await new Promise(resolve => setTimeout(resolve, 0));
            }

            const now = performance.now();
            ssps =
                (batchRun.stepCount - startSteps)
                / (now - startTime) * 1000;
            sps =
                (batchRun.stepCount - lastSteps)
                / (now - lastTime) * 1000;
            lastTime = now;
            lastSteps = batchRun.stepCount;
        }
    };
    return {
        get batchRun() { return batchRun; },
        get isRunning() { return isRunning; },
        get progress() {
            const m = Math.max(...batchRun.args.runArgss
                .map(x => x.stepRecorder?.length ?? Infinity));
            return batchRun.stepCount / m;
        },
        get sps() { return sps; },
        get ssps() { return ssps; },
        start() {
            if (isRunning) { return; }
            isRunning = true;
            return (p = mainLoop());
        },
        stop() {
            if (!isRunning) { return; }
            isRunning = false;
            return p;
        },
    };
}
