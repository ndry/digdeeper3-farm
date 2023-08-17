import jsonBeautify from "json-beautify";
import { jsx } from "@emotion/react";


export function JsonButton({
    name, obj, doNotPrerenderTitle, ...props
}: {
    name?: string;
    obj: unknown;
    doNotPrerenderTitle?: boolean;
} & jsx.JSX.IntrinsicElements["button"]) {
    const text =
        doNotPrerenderTitle
            ? "<not prerendered>"
            : jsonBeautify(obj, null as any, 2, 80);
    return <button {...props}
        title={"Click to copy to clipboard: " + text}
        onClick={() => {
            const text = jsonBeautify(obj, null as any, 2, 80);
            console.log(obj);
            navigator.clipboard.writeText(text);
        }}
    >{name ? name + " " : ""}JSON</button>;
}
