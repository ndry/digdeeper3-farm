import { useLayoutEffect, useState } from "react";
import { jsx } from "@emotion/react";
import { useRecoilState } from "recoil";
import { reactionsRecoil } from "./reactions-recoil";
import { performReactorTick } from "../model/perform-reactor-tick";
import { selectByWeight } from "../../../utils/select-by-weight";
import update from "immutability-helper";

export const runByDefault =
    new URL(location.href).searchParams.get("run") == "1";


export function ReactorView({
    ...props
}: jsx.JSX.IntrinsicElements["div"]) {
    const [renderTrigger, setRenderTrigger] = useState(0);
    const [perf, setPerf] = useState(Infinity);
    const [isRunning, setIsRunning] = useState(runByDefault);
    const [reactions, setReactions] = useRecoilState(reactionsRecoil);

    useLayoutEffect(() => {
        if (!isRunning) { return; }

        let h: ReturnType<typeof setTimeout> | undefined;
        const tick = () => {
            const perfStart = performance.now();

            const eligibleReactions = reactions
                .filter(r =>
                    !r.isPaused
                    && !r.isTrashed
                    && r.repeatAt === undefined
                    && r.priority > 0);

            if (eligibleReactions.length === 0) {
                setIsRunning(false);
                return;
            }

            const selectedReaction =
                selectByWeight(
                    eligibleReactions,
                    r => r.priority,
                    Math.random(), // todo: make deterministic random
                );


            const selectedReaction1 =
                performReactorTick(selectedReaction, {
                    mutableStorageKey: "sdsd223",
                    reactionMultistepSize: 1500,
                    reactionMultistepsPerTick: 100,
                    reactionRepeatSearchWindow: 1000,
                });

            const perfEnd = performance.now();
            setPerf(perfEnd - perfStart);
            setRenderTrigger(x => x + 1);
            setReactions(reactions => update(reactions, {
                [reactions.indexOf(selectedReaction)]: {
                    $set: selectedReaction1,
                },
            }));
            h = setTimeout(tick, 30);
        };
        h = setTimeout(tick, 30);
        return () => { clearTimeout(h); };
    }, [isRunning, reactions]);

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
