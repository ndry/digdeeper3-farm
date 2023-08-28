import { useLayoutEffect, useMemo, useState } from "react";
import { jsx } from "@emotion/react";
import { useRecoilState } from "recoil";
import { reactionsRecoil } from "./reactions-recoil";
import update from "immutability-helper";
import { ReactionSeed } from "../model/perform-reactor-tick";

export const runByDefault =
    new URL(location.href).searchParams.get("run") == "1";

export const eqReactionSeed = (a: ReactionSeed, b: ReactionSeed,) =>
    a.rule === b.rule && a.reagent0 === b.reagent0 && a.reagent1 === b.reagent1;

export function ReactorView({
    ...props
}: jsx.JSX.IntrinsicElements["div"]) {
    const [renderTrigger, setRenderTrigger] = useState(0);
    const [perf, setPerf] = useState(Infinity);
    const [isRunning, setIsRunning] = useState(runByDefault);
    const [reactions, setReactions] = useRecoilState(reactionsRecoil);

    const reactorWorker = useMemo(() => {
        const reactorWorker = new Worker(
            new URL("../model/reactor.worker.ts", import.meta.url),
            { type: "module" });
        reactorWorker.onmessage = e => {
            if (e.data.type === "tick") {
                setPerf(e.data.perf);
                setRenderTrigger(x => x + 1);
                setReactions(reactions => {
                    const index = reactions.findIndex(r =>
                        eqReactionSeed(
                            r.reactionSeed, e.data.reaction.reactionSeed));

                    if (index === -1) { return reactions; }
                    if (reactions[index].t >= e.data.reaction.t) {
                        return reactions;
                    }

                    return update(reactions, {
                        [index]: {
                            t: { $set: e.data.reaction.t },
                            last281: { $set: e.data.reaction.last281 },
                            repeatAt: { $set: e.data.reaction.repeatAt },
                        },
                    });
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
        renderTrigger: {renderTrigger}
        &nbsp;/&nbsp;
        perf: {perf.toFixed(2)}ms

        <br />
    </div>;
}
