import "./disclaimer-panel/init-analytics";

import { Canvas } from "@react-three/fiber";
import { MainScene } from "./main-scene/main-scene";
import { NoToneMapping } from "three";
import { appVersion } from "~appVersion";
import { memo, useRef, useState } from "react";
import { useGrabFocusFromBody } from "../utils/reactish/use-grab-focus-from-body";
import { X as CloseIcon } from "@emotion-icons/boxicons-regular/X";
import "@fontsource/noto-sans-mono";
import { useRecoilState, useSetRecoilState } from "recoil";
import { dropShadow5 } from "../utils/drop-shadow-5";
import { FrameLimiter } from "../utils/reactish/frame-limiter";
import { Invalidator } from "./invalidator";
import { DisclaimerPanel as _DisclaimerPanel } from "./disclaimer-panel";
import { CheckboxWarning as DisclaimerIcon } from "@emotion-icons/fluentui-system-regular/CheckboxWarning";
import { languageRecoil, useResolveByLanguage } from "./language-recoil";
import { muteSoundsRecoil } from "./mute-sounds-recoil";
import { Twemoji } from "react-emoji-render";
import { VolumeMute } from "@emotion-icons/fa-solid/VolumeMute";
import { VolumeUp } from "@emotion-icons/fa-solid/VolumeUp";
import { RulePreview } from "./rule-preview";
import { generateRandomRule } from "../ca/generate-random-rule";

// eslint-disable-next-line no-console 
console.log("appVersion", appVersion);

const eqStringify = <T,>(p: T, n: T) =>
    JSON.stringify(p) === JSON.stringify(n);

const MainCanvas = memo(() => <Canvas
    css={{ position: "absolute", inset: 0, zIndex: -1 }}
    gl={{
        useLegacyLights: true,
        toneMapping: NoToneMapping,
        antialias: true,
    }}
    shadows="percentage"
    frameloop="demand"
>
    <FrameLimiter fps={Infinity} />
    <Invalidator />
    <MainScene />
</Canvas>);

const DisclaimerPanel = memo(_DisclaimerPanel, eqStringify);


export function App() {
    const resolveByLanguage = useResolveByLanguage();
    const languageToDisplayAsSelected = resolveByLanguage({
        "en": "en",
        "uk": "uk",
    }) ?? "en";
    const setLanguage = useSetRecoilState(languageRecoil);

    const [muteSounds, setMuteSounds] = useRecoilState(muteSoundsRecoil);
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
            fontSize: "1.15vmin",
        }}
        ref={focusRootRef}
        tabIndex={-1}
        onKeyDown={ev => {
            if (ev.code === "KeyM") {
                //
            }
        }}
    >
        <MainCanvas />
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
                <RulePreview code={generateRandomRule(3)} />
                <RulePreview code={generateRandomRule(3)} />
                <RulePreview code={generateRandomRule(3)} />
                <RulePreview code={generateRandomRule(3)} />
                <RulePreview code={generateRandomRule(3)} />
                <RulePreview code={generateRandomRule(3)} />
                <RulePreview code={generateRandomRule(3)} />
            </div>
            <button // toggle disclaimer 
                css={{
                    filter: dropShadow5(
                        "0.2vmin", "0.2vmin", "rgb(0 0 0 / 0.5)"),
                    padding: "0",
                    pointerEvents: "all",
                    position: "absolute",
                    right: "1vmin",
                    bottom: "1vmin",
                    fontSize: "2.5em",
                    display: "flex",
                }}
                onClick={() => setIsDisclaimerShown(!isDisclaimerShown)}
            >
                {isDisclaimerShown
                    ? <CloseIcon css={{
                        width: "1em",
                        margin: "0.015em 0 -0.03em 0",
                    }} />
                    : <DisclaimerIcon css={{
                        width: "1em",
                        margin: "0.05em -0.05em -0.05em 0.05em",
                    }} />
                }
            </button>
            <div css={{ // appVersion panel
                position: "absolute",
                right: "5.4vmin",
                bottom: "1vmin",
                textAlign: "right",
                fontSize: "1.4vmin",
                lineHeight: "90%",
                filter: dropShadow5("0.2em", "0.2em", "#00000080"),
            }}>
                {appVersion.split("+")[0]}<br />
                <span css={{ fontSize: "0.8em" }}>
                    {appVersion.split("+")[1]}
                </span>
            </div>
            <DisclaimerPanel
                css={{
                    position: "absolute",
                    left: "50vw",
                    top: "50vh",
                    width: "60vmin",
                    maxHeight: "60vmin",
                    translate: "-50% -50%",
                    background: "rgba(0, 0, 0, 0.9)",
                    pointerEvents: isDisclaimerShown ? "all" : "none",
                    visibility: isDisclaimerShown ? "visible" : "hidden",
                    filter: dropShadow5("0.2em", "0.2em", "rgb(0 0 0 / 0.3)"),
                }}
                onClose={() => setIsDisclaimerShown(false)}
            />
            <div css={{
                position: "absolute",
                right: "13vmin",
                top: "1vmin",
                textAlign: "right",
                fontSize: "1.3em",
                pointerEvents: "all",
            }}>
                {[
                    ["en", "en:us:"],
                    ["uk", "uk:ua:"],
                ].map(([lang, name]) => <span
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    css={{
                        margin: "0 0.2em",
                        cursor: "pointer",
                        ...(languageToDisplayAsSelected === lang && {
                            borderBottom: "1px solid",
                        }),
                    }}
                >
                    <Twemoji>{name}</Twemoji>
                </span>)}
            </div>
            <button
                css={{
                    position: "absolute",
                    right: "7vmin",
                    top: "1vmin",
                    fontSize: "1.5em",
                    pointerEvents: "all",
                }}
                onClick={() => setMuteSounds(!muteSounds)}
            >
                {
                    muteSounds
                        ? <VolumeMute css={{
                            height: "1em",
                            margin: "0.15em 0.12em 0.18em 0em",
                        }} />
                        : <VolumeUp css={{
                            height: "1em",
                            margin: "0.15em 0em 0.18em 0em",
                        }} />
                }
            </button>
        </div>
    </div >;
}