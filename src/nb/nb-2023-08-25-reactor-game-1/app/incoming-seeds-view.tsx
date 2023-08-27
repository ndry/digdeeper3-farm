import { jsx } from "@emotion/react";


export function IncomingSeedsView({
    ...props
}: jsx.JSX.IntrinsicElements["div"]) {
    return <div {...props}>
        Incoming Seeds View<br />
        <br />
        A list of seeds (e.g. 100).<br />
        A player can set priority of any seed or trash it.<br />
        <br />
        The priority moves the seed to the reactor dispatch.<br />
        The trash moves the seed to the trash.<br />
        A new seed is generated to replace the moved seed.<br />
    </div>;
}
