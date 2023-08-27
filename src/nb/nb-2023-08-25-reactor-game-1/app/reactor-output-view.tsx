import { jsx } from "@emotion/react";
import { useRecoilValue } from "recoil";
import { reactorRecoil } from "../reactor-recoil";


export function ReactorOutputView({
    ...props
}: jsx.JSX.IntrinsicElements["div"]) {
    const reactor = useRecoilValue(reactorRecoil);
    return <div {...props}>
        Reactor Output View<br />
        <br />
        A list of reactions that cycled.<br />

        {reactor.output.map((reaction, i) => <div key={i}>
            <pre>{JSON.stringify(reaction, null as any, 2)}</pre>
        </div>)}
    </div>;
}
