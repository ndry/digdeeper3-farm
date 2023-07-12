import { appVersion } from "~appVersion";
import { memo, useMemo, useRef, useState } from "react";
import { useGrabFocusFromBody } from "../utils/reactish/use-grab-focus-from-body";
import { X as CloseIcon } from "@emotion-icons/boxicons-regular/X";
import "@fontsource/noto-sans-mono";
import { useRecoilState, useSetRecoilState } from "recoil";
import { Twemoji } from "react-emoji-render";
import { RulePreview } from "./rule-preview";
import { generateRandomRule } from "../ca/generate-random-rule";
import * as tf from "@tensorflow/tfjs";
import * as pages from "./pages";


const eqStringify = <T,>(p: T, n: T) =>
    JSON.stringify(p) === JSON.stringify(n);


export function App() {
    const focusRootRef = useRef<HTMLDivElement>(null);
    useGrabFocusFromBody(focusRootRef);

    const [isDisclaimerShown, setIsDisclaimerShown] = useState(false);

    return <div
        css={{
            display: "flex",
            position: "fixed",
            inset: "0",
            overflow: "auto",
            fontFamily: "'Noto Sans Mono', monospace",
            fontSize: "1em",
        }}
        ref={focusRootRef}
        tabIndex={-1}
        onKeyDown={ev => {
            if (ev.code === "KeyM") {
                //
            }
        }}
    >
        <div css={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            display: "flex",
            flex: "row",
            overflow: "hidden",
        }}>
            <div css={{
                position: "absolute",
                inset: 0,
                pointerEvents: "all",
            }}>
                {[
                    ...Object.keys(pages).map(k => `./?${k}`),
                ].map((path, i) => <a
                    css={{
                        display: "block",
                        backgroundColor: "#af7272",
                    }}
                    key={i}
                    href={path}
                >{path}</a>)}
                <RulePreview code={generateRandomRule(3)} />
                <RulePreview code={generateRandomRule(3)} />
                <RulePreview code={generateRandomRule(3)} />
                <RulePreview code={generateRandomRule(3)} />
                <RulePreview code={generateRandomRule(3)} />
                <RulePreview code={generateRandomRule(3)} />
                <RulePreview code={generateRandomRule(3)} />
            </div>
            <div css={{ // appVersion panel
                position: "absolute",
                right: "5.4vmin",
                bottom: "1vmin",
                textAlign: "right",
                fontSize: "1.4vmin",
                lineHeight: "90%",
            }}>
                {appVersion.split("+")[0]}<br />
                <span css={{ fontSize: "0.8em" }}>
                    {appVersion.split("+")[1]}
                </span>
            </div>
        </div>
    </div >;
}