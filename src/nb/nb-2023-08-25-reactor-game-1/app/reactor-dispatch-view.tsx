import { jsx } from "@emotion/react";


export function ReactorDispatchView({
    ...props
}: jsx.JSX.IntrinsicElements["div"]) {
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
    </div>;
}
