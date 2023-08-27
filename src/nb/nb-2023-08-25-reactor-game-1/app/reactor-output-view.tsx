import { jsx } from "@emotion/react";


export function ReactorOutputView({
    ...props
}: jsx.JSX.IntrinsicElements["div"]) {
    return <div {...props}>
        Reactor Output View<br />
        <br />
        A list of reactions that cycled.<br />
    </div>;
}
