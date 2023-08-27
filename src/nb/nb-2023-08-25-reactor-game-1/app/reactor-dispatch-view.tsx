import { jsx } from "@emotion/react";


export function ReactorDispatchView({
    ...props
}: jsx.JSX.IntrinsicElements["div"]) {
    // - reactor dispatch, what loaded into reactor / can set priority or trash
    return <div {...props}>
        Reactor Dispatch View
    </div>;
}
