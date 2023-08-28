import { useLayoutEffect, useMemo, useState } from "react";
import { jsx } from "@emotion/react";
import { useRecoilState } from "recoil";
import { reactionsRecoil } from "./reactions-recoil";
import { createReactor } from "../model/create-reactor";

export const runByDefault =
    new URL(location.href).searchParams.get("run") == "1";


export function ReactorView({
    ...props
}: jsx.JSX.IntrinsicElements["div"]) {
    const [renderTrigger, setRenderTrigger] = useState(0);
    const [perf, setPerf] = useState(Infinity);
    const [isRunning, setIsRunning] = useState(runByDefault);
    const [reactions, setReactions] = useRecoilState(reactionsRecoil);

    const reactor = useMemo(() => createReactor({
        isRunning, // use once, not observe
        reactions, // use once, not observe
        onTick: x => {
            if (x === "exhausted") {
                setIsRunning(false);
                return;
            }
            setPerf(x.perf);
            setRenderTrigger(x => x + 1);
            setReactions(x.reactions);
        },
    }), [setReactions, setRenderTrigger, setPerf]);

    useLayoutEffect(() => reactor.setIsRunning(isRunning), [isRunning]);
    useLayoutEffect(() => reactor.setReactions(reactions), [reactions]);
    useLayoutEffect(() => () => reactor.dispose(), []);

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
