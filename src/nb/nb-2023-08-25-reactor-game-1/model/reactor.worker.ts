import { performReactorTick } from "./perform-reactor-tick";
import { ReactionSeed } from "./reaction-seed";


export type ReactorWorkerJob = {
    refReactionSeed: ReactionSeed,
    reactionSeed: ReactionSeed,
    // dt: number,
};



const dt = 100_000;

let jobRequestTime = -1;
function performJob(job: ReactorWorkerJob) {

    const perfStart = performance.now();
    const esimatedIdleTime = perfStart - jobRequestTime;

    const { outputs, steps } = performReactorTick(
        job.reactionSeed,
        {
            dt,
            reactionRepeatSearchWindow: 10_000,
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
    type: "job",
    job: ReactorWorkerJob,
}>) => {
    if (ev.data.type !== "job") { return; }
    performJob(ev.data.job);
};

jobRequestTime = performance.now();
postMessage({ type: "jobRequest" });