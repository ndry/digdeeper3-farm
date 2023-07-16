import { ReadonlyDeep } from "../../utils/readonly-deep";
import { createBatchRun } from "./batch-run";

const isPromise = <T>(x: T | Promise<T>): x is Promise<T> =>
    typeof x === "object" && x && "then" in x;

export function createBatchRunScheduler(
    batchRun: ReadonlyDeep<ReturnType<typeof createBatchRun>>,
) {
    let isRunning = false;
    let p: Promise<void> | undefined;
    const mainLoop = async () => {
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
        }
    };
    return {
        get batchRun() { return batchRun; },
        get isRunning() { return isRunning; },
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
