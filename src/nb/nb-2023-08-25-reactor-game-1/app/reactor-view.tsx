import { useLayoutEffect, useMemo, useState } from "react";
import { jsx } from "@emotion/react";
import { useRecoilState } from "recoil";
import { reactionsRecoil } from "./reactions-recoil";
import update from "immutability-helper";
import { ReactionCard } from "../model/reaction-card";
import { ReactionOutput, hasSeedRepeated, registerReactionOutput } from "../model/reaction-output-registry";

export const runByDefault =
    new URL(location.href).searchParams.get("run") == "1";

export function ReactorView({
    ...props
}: jsx.JSX.IntrinsicElements["div"]) {
    const [renderTrigger, setRenderTrigger] = useState(0);
    const [perf, setPerf] = useState<{
        perf: number,
        steps: number,
    }>();
    const [isRunning, setIsRunning] = useState(runByDefault);
    const [reactions, setReactions] = useRecoilState(reactionsRecoil);

    const reactorWorker = useMemo(() => {
        const reactorWorker = new Worker(
            new URL("../model/reactor.worker.ts", import.meta.url),
            { type: "module" });
        reactorWorker.onmessage = (ev: MessageEvent<{
            type: "tick",
            perf: number,
            steps: number,
        } | {
            type: "reactionOutput",
            reactionOutput: ReactionOutput,
        }>) => {
            const data = ev.data;
            if (data.type === "tick") {
                setPerf({
                    perf: data.perf,
                    steps: data.steps,
                });
                setRenderTrigger(x => x + 1);
                return;
            }
            if (data.type === "reactionOutput") {
                registerReactionOutput(data.reactionOutput);
            }
        }
        return reactorWorker;
    }, [setReactions, setRenderTrigger, setPerf]);

    useLayoutEffect(
        () => reactorWorker.postMessage({
            type: "isRunning",
            isRunning,
        }),
        [reactorWorker, isRunning]);
    useLayoutEffect(
        () => reactorWorker.postMessage({
            type: "reactions",
            reactions: reactions
                .filter(r => !r.isPaused
                    && !r.isTrashed
                    && !hasSeedRepeated(r.reactionSeed)
                    && r.priority > 0),
        }),
        [reactorWorker, reactions]);
    useLayoutEffect(() => () => reactorWorker.terminate(), [reactorWorker]);

    return <div {...props}>
        Reactor
        &nbsp;/&nbsp;
        <button onClick={() => setIsRunning(x => !x)}>
            {isRunning ? "pause" : "run"}
        </button>
        &nbsp;/&nbsp;
        render: {renderTrigger}
        {perf && <>
            &nbsp;/&nbsp;
            perf: {formatWithSuffix(perf.steps)}
            &nbsp;steps per {perf.perf.toFixed(2)}ms
            ={formatWithSuffix(perf.steps / perf.perf * 1000)}Hz
        </>}

        <br />
    </div>;
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