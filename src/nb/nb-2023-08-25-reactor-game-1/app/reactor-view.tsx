import { useLayoutEffect, useMemo, useState } from "react";
import { jsx } from "@emotion/react";
import { useRecoilState } from "recoil";
import { reactionsRecoil } from "./reactions-recoil";
import { ReactionOutput, getLatestOutput, hasSeedRepeated, registerReactionOutput } from "../model/reaction-output-registry";
import { ReactorWorkerJob } from "../model/reactor.worker";
import { selectByWeight } from "../../../utils/select-by-weight";

export const runByDefault =
    new URL(location.href).searchParams.get("run") == "1";


export function ReactorView({
    ...props
}: jsx.JSX.IntrinsicElements["span"]) {
    const [renderTrigger, setRenderTrigger] = useState(0);
    const [metrics, setMetrics] = useState<{
        perf: number,
        steps: number,
        esimatedIdleTime: number,
    }>();
    const [isRunning, setIsRunning] = useState(runByDefault);
    const [reactions, setReactions] = useRecoilState(reactionsRecoil);

    const reactorWorker = useMemo(() => {
        if (!isRunning) { return; }
        const w = new Worker(
            new URL("../model/reactor.worker.ts", import.meta.url),
            { type: "module" });
        w.addEventListener("message", (ev: MessageEvent<{
            type: "jobCompletion",
            job: ReactorWorkerJob,
            outputs: ReactionOutput[],
            metrics: {
                perf: number,
                steps: number,
                esimatedIdleTime: number,
            }
        }>) => {
            const data = ev.data;
            if (data.type !== "jobCompletion") { return; }
            const latestOuput = getLatestOutput(data.job.refReactionSeed);
            for (const output of data.outputs) {
                registerReactionOutput(output);
                if (latestOuput) {
                    registerReactionOutput({
                        seed: data.job.refReactionSeed,
                        t: output.t + latestOuput.t,
                        output: output.output,
                        tags: output.tags,
                    });
                }
            }
            setMetrics(data.metrics);
            setRenderTrigger(x => x + 1);
        });
        return w;
    }, [setReactions, setRenderTrigger, setMetrics, isRunning]);

    useLayoutEffect(() => {
        const w = reactorWorker;
        if (!w) { return; }
        const l = (ev: MessageEvent<{
            type: "jobRequest",
        }>) => {
            const data = ev.data;
            if (data.type !== "jobRequest") { return; }
            const rc = selectByWeight(
                reactions.filter(r =>
                    !r.isTrashed
                    && !r.isPaused
                    && r.priority > 0
                    && !hasSeedRepeated(r.reactionSeed)),
                r => r.priority,
                Math.random(),
            );
            const latestOuput = getLatestOutput(rc.reactionSeed);
            w.postMessage({
                type: "job",
                job: {
                    refReactionSeed: rc.reactionSeed,
                    reactionSeed: latestOuput?.output ?? rc.reactionSeed,
                },
            });
        };
        w.addEventListener("message", l);
        return () => { w.removeEventListener("message", l); }
    }, [reactorWorker, reactions]);
    useLayoutEffect(() => {
        const w = reactorWorker;
        if (!w) { return; }
        () => w.terminate();
    }, [reactorWorker]);

    return <span {...props}>
        Reactor
        &nbsp;/&nbsp;
        <button onClick={() => setIsRunning(x => !x)}>
            {isRunning ? "pause" : "run"}
        </button>
        &nbsp;/&nbsp;
        render: {renderTrigger}
        {metrics && <>
            &nbsp;/&nbsp;
            perf: {formatWithSuffix(metrics.steps)}
            &nbsp;steps per {metrics.perf.toFixed(2)}ms
            ={formatWithSuffix(metrics.steps / metrics.perf * 1000)}Hz
            &nbsp;/&nbsp;
            estimated idle time: {metrics.esimatedIdleTime.toFixed(2)}ms
        </>}

        <br />
    </span>;
}

export function formatWithSuffix(n: number): string {
    if (n < 0) { return "-" + formatWithSuffix(-n); }
    if (n < 1e-6) { return n.toExponential(2); }
    if (n < 1e-3) { return (n * 1e6).toFixed(2) + "u"; }
    if (n < 1e0) { return (n * 1e3).toFixed(2) + "m"; }
    if (n < 1e3) { return n.toString(); }
    if (n < 1e6) { return (n / 1e3).toFixed(2) + "k"; }
    if (n < 1e9) { return (n / 1e6).toFixed(2) + "M"; }
    if (n < 1e12) { return (n / 1e9).toFixed(2) + "G"; }
    if (n < 1e15) { return (n / 1e12).toFixed(2) + "T"; }
    return n.toExponential(2);
}