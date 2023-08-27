import { jsx } from "@emotion/react";


export function TrashView({
    ...props
}: jsx.JSX.IntrinsicElements["div"]) {
    // - trash in trashed order / can restore by setting priority
    return <div {...props}>
        Trash View
    </div>;
}
