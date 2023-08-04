import { useEffect, useMemo, useRef } from "react";
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

export function xx({
    rule,
    spaceSize,
    timeSize,
    seed,
    window,
    scale = 1,
}: {
    rule: Rule,
    spaceSize: number,
    timeSize: number,
    seed: number,
    window: number,
    scale?: number,
}) {
    const canvasEl = document.createElement("canvas");
    canvasEl.style.imageRendering = "pixelated";

    const perfStart = performance.now();

    const c = window;
    const w = spaceSize / c;
    const h = timeSize / c;
    const v = 255 / c / c;
    const ctx = canvasEl.getContext("2d");
    if (!ctx) { throw new Error("no ctx"); }
    const imageData = ctx.createImageData(w, h);
    const statsImageData = ctx.createImageData(w, h);

    const table = parseTable(rule);
    const random32 = createMulberry32(seed);

    const spacetime = Array.from(
        { length: window },
        () => new Uint8Array(spaceSize));

    const statsC = 5;
    const stats2 = Array.from(
        { length: h },
        () => new Uint32Array(3 ** statsC));
    const colors = Array.from(
        { length: 3 ** statsC },
        (_, i) => {
            const digits = i.toString(3).padStart(statsC, "0").split("").map(Number);
            return [
                Math.floor(digits.filter((d) => d === 0).length / digits.length * 255),
                Math.floor(digits.filter((d) => d === 1).length / digits.length * 255),
                Math.floor(digits.filter((d) => d === 2).length / digits.length * 255),
            ];
        });

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
                    const x = px * c + dx;
                    const s = spacetime[t][x];
                    sc[s]++;

                    if (x >= statsC) {
                        let ps = 0;
                        for (let i = 0; i < statsC; i++) {
                            ps += spacetime[t][x - i - 1] * 3 ** i;
                        }
                        stats2[py][ps * 3 + s]++;
                    }
                }
            }

            imageData.data[i + 0] = sc[0] * v;
            imageData.data[i + 1] = sc[1] * v;
            imageData.data[i + 2] = sc[2] * v;
            imageData.data[i + 3] = 255;
        }

        for (let s = 0; s < 3 ** statsC; s++) {
            const absX = stats2[py][s] / spaceSize;
            const x1 = Math.log(stats2[py][s]) / Math.log(10);
            const x = Math.floor(x1 * w / c * 1);
            if (x >= w) { continue; }
            const si = (x + py * w) * 4;
            statsImageData.data[si + 0] = colors[s][0];
            statsImageData.data[si + 1] = colors[s][1];
            statsImageData.data[si + 2] = colors[s][2];
            statsImageData.data[si + 3] = 255;
        }
    }

    canvasEl.width = w * scale * 2;
    canvasEl.height = h * scale;

    ctx.putImageData(imageData, 0, 0);
    ctx.putImageData(statsImageData, w, 0);
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

    return {
        canvasEl,
    };
}

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
    const x = useMemo(
        () => xx({ rule, spaceSize, timeSize, seed, window, scale }),
        [rule, spaceSize, timeSize, seed, window, scale]);

    const divRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const divEl = divRef.current;
        if (!divEl) { return; }

        divEl.innerHTML = "";
        divEl.appendChild(x.canvasEl);
    }, [x]);

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
                body: `#like #${rule} #nb_2023_08_01_convo1_v0a_rule_preview_1`,
            });
        }}>#like</button>
        <div
            ref={divRef}
            title={rule}
        ></div>
    </div>;
}