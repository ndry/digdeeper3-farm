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


const eqStringify = <T,>(p: T, n: T) =>
    JSON.stringify(p) === JSON.stringify(n);


export function App() {
    const focusRootRef = useRef<HTMLDivElement>(null);
    useGrabFocusFromBody(focusRootRef);

    // const x = useMemo(() => {
    //     (async () => {

    //         const data = [
    //             [[1, 1, 0], 0],
    //             [[1, 0, 1], 1],
    //             [[0, 1, 1], 2],
    //             [[0, 0, 0], 0],
    //             [[0, 1, 0], 0],
    //             [[0, 0, 1], 1],
    //             [[0, 1, 1], 2],
    //             [[1, 0, 0], 0],

    //         ] as [number[], number][];

    //         const model = tf.sequential();
    //         model.add(tf.layers.dense({
    //             units: 250,
    //             activation: "relu",
    //             inputShape: [
    //                 data[0][0].length,
    //             ]
    //         }));
    //         model.add(tf.layers.dense({ units: 175, activation: "relu" }));
    //         model.add(tf.layers.dense({ units: 150, activation: "relu" }));
    //         model.add(tf.layers.dense({ units: 3, activation: "softmax" }));

    //         model.compile({
    //             optimizer: tf.train.adam(),
    //             loss: "sparseCategoricalCrossentropy",
    //             metrics: ["accuracy"]
    //         });


    //         const numTrainingIterations = 10;
    //         for (let i = 0; i < numTrainingIterations; i++) {
    //             console.log(`Training iteration : ${i + 1} / ${numTrainingIterations}`);
    //             await model.fit(
    //                 tf.tensor(data.map(([x]) => x)),
    //                 tf.tensor(data.map(([, y]) => y)),
    //                 {
    //                     epochs: 1,
    //                 },
    //             )
    //         }

    //         const p = (model.predict(tf.tensor([[0, 1, 1]])) as tf.Tensor)
    //             .dataSync();


    //         console.log(p);

    //     })();

    // }, []);

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
                    "./nb/nb-2023-07-05/",
                ].map((path, i) => <a key={i} href={path}>{path}</a>)}
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