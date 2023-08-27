import { jsx } from "@emotion/react";
import { useRecoilState } from "recoil";
import { reactorRecoil } from "../reactor-recoil";
import jsonBeautify from "json-beautify";
import { performReactorTick } from "../model/perform-reactor-tick";


export function ReactorDispatchView({
    ...props
}: jsx.JSX.IntrinsicElements["div"]) {
    const [reactor, setReactor] = useRecoilState(reactorRecoil);
    return <div {...props}>
        Reactor Dispatch View<br />
        <br />
        Reactor acts in steps. Each reaction in a dispatch has a priority.<br />
        The priority determines the probability
        of the reaction being selected for the specific tick.<br />
        <br />
        Ones the reaction cycled, it is moved to the reactor output.<br />
        <br />
        A player can change the priority of any reaction or trash it.<br />

        {reactor.reactionPool.map((reaction, i) => <div key={i}>
            <pre>{jsonBeautify(reaction, null as any, 2, 80)}</pre>
        </div>)}
        <button onClick={() => {
            setReactor(performReactorTick);
        }} >Tick</button>
    </div>;
}
