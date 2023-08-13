import jsonBeautify from "json-beautify";
import { jsx } from "@emotion/react";


export function JsonButton({
    name, obj,
}: {
    name?: string;
    obj: unknown;
} & jsx.JSX.IntrinsicElements["button"]) {
    const text = jsonBeautify(obj, null as any, 2, 80);
    return <button
        title={"Click to copy to clipboard: " + text}
        onClick={() => {
            console.log(obj);
            navigator.clipboard.writeText(text);
        }}
    >{name ? name + " " : ""}JSON</button>;
}
