import { performReactorTick } from "./perform-reactor-tick";
import { ReactionSeed } from "./reaction-seed";


export type ReactorWorkerJob = {
    refReactionSeed: ReactionSeed,
    reactionSeed: ReactionSeed,
    // dt: number,
};



const dt = 3_000_000;

let jobRequestTime = -1;
function performJob(job: ReactorWorkerJob) {

    const perfStart = performance.now();
    const esimatedIdleTime = perfStart - jobRequestTime;

    const { outputs, steps } = performReactorTick(
        job.reactionSeed,
        {
            dt,
            reactionRepeatSearchWindow: 1500,
        });

    jobRequestTime = performance.now();
    const perf = jobRequestTime - perfStart;
    postMessage({
        type: "jobCompletion",
        job,
        outputs,
        metrics: {
            perf,
            steps,
            esimatedIdleTime,
        },
    });

    postMessage({ type: "jobRequest" });
}

onmessage = (ev: MessageEvent<{
    type: "isRunning",
    isRunning: boolean,
} | {
    type: "job",
    job: ReactorWorkerJob,
}>) => {
    if (ev.data.type === "job") {
        performJob(ev.data.job);
        return;
    }
};

jobRequestTime = performance.now();
postMessage({ type: "jobRequest" });