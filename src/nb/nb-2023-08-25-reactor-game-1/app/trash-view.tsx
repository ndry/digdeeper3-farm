import { jsx } from "@emotion/react";


export function TrashView({
    ...props
}: jsx.JSX.IntrinsicElements["div"]) {
    return <div {...props}>
        Trash View<br />
        <br />
        A list of trashed items.<br />
        A player can restore any item by setting its priority.<br />
    </div>;
}
