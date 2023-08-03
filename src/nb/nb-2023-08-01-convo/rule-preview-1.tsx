import { useEffect, useRef } from "react";
import type { jsx } from "@emotion/react";
import { createFullCanvasImageData32 } from "../../utils/create-image-data32";
import { createMulberry32 } from "../../utils/mulberry32";
import { Rule, parseTable } from "../../ca237v1/rule-io";
import { fillSpacetime } from "../../ca237v1/fill-spacetime";
import { stateCount } from "../../ca237v1/state-count";
import { fillSpace } from "../../ca237v1/fill-space";

export const colorMap = [
    "#ff0000",
    "#00ff00",
    "#0000ff",
] as const;

export function RulePreview1({
    rule,
    spaceSize,
    timeSize,
    seed,
    window,
    scale = 1,
    css: cssProp,
    ...props
}: {
    rule: Rule,
    spaceSize: number,
    timeSize: number,
    seed: number,
    window: number,
    scale?: number,
} & jsx.JSX.IntrinsicElements["div"]) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvasEl = canvasRef.current;
        if (!canvasEl) { return; }

        const perfStart = performance.now();

        const c = window;
        const w = spaceSize / c;
        const h = timeSize / c;
        const v = 255 / c / c;
        canvasEl.width = w;
        canvasEl.height = h;
        const {
            ctx,
            put,
            imageData,
        } = createFullCanvasImageData32(canvasEl);

        const table = parseTable(rule);
        const random32 = createMulberry32(seed);

        const spacetime = Array.from(
            { length: window },
            () => new Uint8Array(spaceSize));

        for (let py = 0; py < h; py++) {
            if (py === 0) {
                for (let t = 0; t < 2; t++) {
                    for (let x = 0; x < spaceSize; x++) {
                        spacetime[t][x] = random32() % stateCount;
                    }
                }
            } else {
                for (let t = 0; t < 2; t++) {
                    spacetime[t][0] = random32() % stateCount;
                    spacetime[t][spaceSize - 1] = random32() % stateCount;
                    fillSpace(stateCount,
                        spacetime.at(t - 2)!,
                        spacetime.at(t - 1)!,
                        spacetime[t],
                        table);
                }
            }
            for (let t = 2; t < spacetime.length; t++) {
                spacetime[t][0] = random32() % stateCount;
                spacetime[t][spaceSize - 1] = random32() % stateCount;
                fillSpace(stateCount,
                    spacetime[t - 2], spacetime[t - 1], spacetime[t],
                    table);
            }


            for (let px = 0; px < w; px++) {
                const i = (px + py * w) * 4;

                const sc = [0, 0, 0];
                for (let t = 0; t < spacetime.length; t++) {
                    for (let dx = 0; dx < c; dx++) {
                        sc[spacetime[t][px * c + dx]]++;
                    }
                }

                imageData.data[i + 0] = sc[0] * v;
                imageData.data[i + 1] = sc[1] * v;
                imageData.data[i + 2] = sc[2] * v;
                imageData.data[i + 3] = 255;
            }
        }

        canvasEl.width *= scale;
        canvasEl.height *= scale;

        put();
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(
            canvasEl,
            0, 0, canvasEl.width / scale, canvasEl.height / scale,
            0, 0, canvasEl.width, canvasEl.height);

        const perfEnd = performance.now();
        console.log({
            perfMs: perfEnd - perfStart,
            rule,
        });

    }, [canvasRef.current, rule, spaceSize, timeSize, seed, scale]);

    return <div
        css={[{

        }, cssProp]}
        {...props}
    >
        <a
            href={`./notes/?${(() => {
                const p = new URLSearchParams();
                p.set("filter", JSON.stringify({ tags: rule }));
                return p;
            })()}`}
            target="_blank"
        >link</a>
        <br />
        <button onClick={async () => {
            await fetch("https://hq.x-pl.art/notes/", {
                method: "POST",
                body: `#like #${rule} #nb_2023_08_01_convo_v0a_rule_preview_1`,
            });
        }}>#like</button>
        <canvas
            ref={canvasRef}
            title={rule}
            css={[{
                imageRendering: "pixelated",
                display: "block",
            }]}
        />
    </div>;
}