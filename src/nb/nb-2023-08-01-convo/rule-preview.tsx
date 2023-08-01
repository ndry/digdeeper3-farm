import { useEffect, useRef } from "react";
import type { jsx } from "@emotion/react";
import { createFullCanvasImageData32 } from "../../utils/create-image-data32";
import { createMulberry32 } from "../../utils/mulberry32";
import { Rule } from "../../ca237v1/rule-io";
import { fillSpacetime } from "../../ca237v1/fill-spacetime";

export const colorMap = [
    "#ff0000",
    "#00ff00",
    "#0000ff",
] as const;

export function RulePreview({
    rule,
    spaceSize,
    timeSize,
    seed,
    scale = 1,
    css: cssProp,
    ...props
}: {
    rule: Rule,
    spaceSize: number,
    timeSize: number,
    seed: number,
    scale?: number,
} & jsx.JSX.IntrinsicElements["div"]) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvasEl = canvasRef.current;
        if (!canvasEl) { return; }

        const w = timeSize;
        const h = spaceSize;
        const pixelsPerCell = 1;
        canvasEl.width = w * pixelsPerCell;
        canvasEl.height = h * pixelsPerCell;
        const {
            ctx,
            put,
            setPixel,
        } = createFullCanvasImageData32(canvasEl);

        const spacetime = fillSpacetime({
            rule,
            spaceSize,
            timeSize,
            startFillState: 0,
            random32: createMulberry32(seed),
        });

        for (let x = 0; x < w; x++) {
            for (let y = 0; y < h; y++) {
                setPixel(x, y, colorMap[spacetime[x][y]]);
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

    }, [canvasRef.current, rule, spaceSize, timeSize, seed, scale]);

    return <div
        css={[{

        }, cssProp]}
        {...props}
    >
        <canvas
            ref={canvasRef}
            title={rule}
            css={[{
                imageRendering: "pixelated",
            }]}
        />
    </div>;
}