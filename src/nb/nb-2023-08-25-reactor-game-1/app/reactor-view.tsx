import { useLayoutEffect, useMemo, useState } from "react";
import { jsx } from "@emotion/react";
import { useRecoilState } from "recoil";
import { reactionsRecoil } from "./reactions-recoil";
import update from "immutability-helper";
import { ReactionSeed } from "../model/perform-reactor-tick";
import { ReactionCard } from "../model/reaction-card";

export const runByDefault =
    new URL(location.href).searchParams.get("run") == "1";

export const eqReactionSeed = (a: ReactionSeed, b: ReactionSeed,) =>
    a.rule === b.rule && a.reagent0 === b.reagent0 && a.reagent1 === b.reagent1;

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
                        const index = reactions.findIndex(r =>
                            eqReactionSeed(
                                r.reactionSeed, receivedReaction.reactionSeed));

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
            perf: {perf.steps} steps per {perf.perf.toFixed(2)}ms
            ={(perf.steps / perf.perf * 1e3 / 1e6).toFixed(2)} MHz
        </>}

        <br />
    </div>;
}
