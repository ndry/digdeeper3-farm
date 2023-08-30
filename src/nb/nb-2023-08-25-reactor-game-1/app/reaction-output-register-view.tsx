import { jsx } from "@emotion/react";
import { useLayoutEffect, useState } from "react";
import { subscribeToReactionOutputGlobal } from "../model/reaction-output-registry";
import jsonBeautify from "json-beautify";


export function ReactionOutputRegisterView({
    ...props
}: jsx.JSX.IntrinsicElements["div"]) {
    const [r, setR] = useState<any>();

    useLayoutEffect(() => {
        const us = subscribeToReactionOutputGlobal((reactionOutput, r) => {
            setR({ r }); // create a new object to force re-render
        });
        return () => { us(); };
    }, [setR]);

    return <div {...props}>
        {r && <pre>{jsonBeautify(r, null as any, 2, 80)}</pre>}
    </div>;
}
