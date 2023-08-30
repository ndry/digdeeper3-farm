import { useLayoutEffect, useMemo, useState } from "react";
import { jsx } from "@emotion/react";
import { useRecoilState } from "recoil";
import { reactionsRecoil } from "./reactions-recoil";
import update from "immutability-helper";
import { ReactionCard } from "../model/reaction-card";

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
            reactions: ReactionCard[],
        }>) => {
            if (ev.data.type === "tick") {
                setPerf({
                    perf: ev.data.perf,
                    steps: ev.data.steps,
                });
                setRenderTrigger(x => x + 1);
                setReactions(reactions => {
                    for (const receivedReaction of ev.data.reactions) {
                        const index = reactions
                            .findIndex(r =>
                                r.reactionSeed
                                === receivedReaction.reactionSeed);

                        if (index === -1) { continue; }
                        if (reactions[index].t >= receivedReaction.t) {
                            continue;
                        }

                        reactions = update(reactions, {
                            [index]: {
                                t: { $set: receivedReaction.t },
                                last281: { $set: receivedReaction.last281 },
                                repeatAt: { $set: receivedReaction.repeatAt },
                                marks: { $set: receivedReaction.marks },
                            },
                        });
                    }
                    return reactions;
                });
                return;
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
                    && r.repeatAt === undefined
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
    if (n < 1e-9) { return n.toExponential(2); }
    if (n < 1e-6) { return (n * 1e6).toFixed(2) + "u"; }
    if (n < 1e-3) { return (n * 1e3).toFixed(2) + "m"; }
    if (n < 1e3) { return n.toString(); }
    if (n < 1e6) { return (n / 1e3).toFixed(2) + "k"; }
    if (n < 1e9) { return (n / 1e6).toFixed(2) + "M"; }
    if (n < 1e12) { return (n / 1e9).toFixed(2) + "G"; }
    if (n < 1e15) { return (n / 1e12).toFixed(2) + "T"; }
    return n.toExponential(2);
}