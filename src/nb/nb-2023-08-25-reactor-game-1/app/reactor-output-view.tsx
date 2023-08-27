import { jsx } from "@emotion/react";


export function ReactorOutputView({
    ...props
}: jsx.JSX.IntrinsicElements["div"]) {
    // - reactor output, what cycled / can view stats and do nothing
    return <div {...props}>
        Reactor Output View
    </div>;
}
