import { useEffect, useRef } from "react";
import type { jsx } from "@emotion/react";
import { createFullCanvasImageData32 } from "../../utils/create-image-data32";
import { createMulberry32 } from "../../utils/mulberry32";
import { Rule, parseTable } from "../../ca237v1/rule-io";
import { fillSpacetime } from "../../ca237v1/fill-spacetime";
import { stateCount } from "../../ca237v1/state-count";
import { fillSpace } from "../../ca237v1/fill-space";
import { getDigits } from "../../ca/digits";
import { getFullCombinedState } from "../../ca237v1/get-full-combined-state";

export const colorMap = [
    "#ff0000",
    "#00ff00",
    "#0000ff",
] as const;

const getFullCombinedState81 = (n1: number, c: number, n2: number) =>
    (n1 * 81 + c) * 81 + n2;

const read81 = (x: number, i: number) => Math.floor(x / (3 ** i)) % 3;

const buildTable81 = (table: number[]) => {
    const r = read81;
    const table81 = Array.from({ length: 81 ** 3 }, () => 0);
    for (let n1 = 0; n1 < 81; n1++) {
        for (let c = 0; c < 81; c++) {
            for (let n2 = 0; n2 < 81; n2++) {
                const spacetime = [
                    [r(n1, 3), r(n1, 2), r(c, 3), r(c, 2), r(n2, 3), r(n2, 2)],
                    [r(n1, 1), r(n1, 0), r(c, 1), r(c, 0), r(n2, 1), r(n2, 0)],
                    [0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0],
                ];
                fillSpace(3, spacetime[0], spacetime[1], spacetime[2], table);
                fillSpace(3, spacetime[1], spacetime[2], spacetime[3], table);
                const s = spacetime[2][2] * 27
                    + spacetime[2][3] * 9
                    + spacetime[3][2] * 3
                    + spacetime[3][3];
                table81[getFullCombinedState81(n1, c, n2)] = s;
            }
        }
    }
    return table81;
};

export function RulePreview2({
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

        const stateCount81 = 81;
        const spaceSize81 = spaceSize / 2;
        const timeSize81 = timeSize / 2;
        const window81 = window / 2;

        const table = parseTable(rule);
        const table81 = buildTable81(table);
        const random32 = createMulberry32(seed);

        const spacetime81 = Array.from(
            { length: window81 },
            () => new Uint8Array(spaceSize81));

        for (let py = 0; py < h; py++) {
            if (py === 0) {
                for (let t = 0; t < 1; t++) {
                    for (let x = 0; x < spaceSize; x++) {
                        spacetime81[t][x] = random32() % stateCount81;
                    }
                }
                for (let t = 1; t < spacetime81.length; t++) {
                    spacetime81[t][0] = random32() % stateCount81;
                    spacetime81[t][spaceSize81 - 1] = random32() % stateCount81;

                    const prevSpace = spacetime81.at(t - 1)!;
                    const outSpace = spacetime81[t];

                    const nr = 1;
                    for (let x = nr; x < outSpace.length - nr; x++) {
                        outSpace[x] = table81[getFullCombinedState81(
                            prevSpace[x - 1],
                            prevSpace[x],
                            prevSpace[x + 1])];
                    }
                }
            } else {
                for (let t = 0; t < spacetime81.length; t++) {
                    spacetime81[t][0] = random32() % stateCount81;
                    spacetime81[t][spaceSize81 - 1] = random32() % stateCount81;

                    const prevSpace = spacetime81.at(t - 1)!;
                    const outSpace = spacetime81[t];

                    const nr = 1;
                    for (let x = nr; x < outSpace.length - nr; x++) {
                        outSpace[x] = table81[getFullCombinedState81(
                            prevSpace[x - 1],
                            prevSpace[x],
                            prevSpace[x + 1])];
                    }
                }
            }


            for (let px = 0; px < w; px++) {
                const i = (px + py * w) * 4;

                const sc = [0, 0, 0];
                for (let t = 0; t < spacetime81.length; t++) {
                    for (let dx = 0; dx < window81; dx++) {
                        const s = spacetime81[t][px * window81 + dx];
                        sc[read81(s, 0)]++;
                        sc[read81(s, 1)]++;
                        sc[read81(s, 2)]++;
                        sc[read81(s, 3)]++;
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
            s: "RulePreview2",
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