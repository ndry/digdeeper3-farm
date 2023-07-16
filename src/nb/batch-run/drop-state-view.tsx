import { useLayoutEffect, useRef } from "react";
import { createFullCanvasImageData32, cssColorToAbgr } from "../../utils/create-image-data32";
import { jsx } from "@emotion/react";
import { neighborhood, neighborhoodRadius } from "../nb-2023-07-06/neural-walker";
import { createDropState } from "./drop-state";
import { ReadonlyDeep } from "ts-toolbelt/out/Object/Readonly";


export const colorMap = [
    "#8000ff", // empty
    "#000000", // wall
    "#80ff00", // energy
    "#a00000", // visited
] as const;
export const colorMapAbgr = colorMap.map(cssColorToAbgr);
export const playerColor = "#ff0000ff";

export function DropStateView({
    scale, dropState, ...props
}: jsx.JSX.IntrinsicElements["div"] & {
    scale: number;
    dropState: ReadonlyDeep<ReturnType<typeof createDropState>>;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useLayoutEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) { return; }

        const w = dropState.dropzone.spaceSize;
        const h = 300;
        canvas.width = w;
        canvas.height = h;
        const {
            ctx, put, setPixel, data32,
        } = createFullCanvasImageData32(canvas);
        canvas.width *= scale;
        canvas.height *= scale;


        let handle: number;
        let lastStepCount = -1;
        const render = () => {
            handle = requestAnimationFrame(render);

            if (lastStepCount === dropState.stepCount) { return; }
            lastStepCount = dropState.stepCount;

            const {
                depth: d, playerPositionX: px, playerPositionT: pt,
            } = dropState;
            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    /**
                     * Performance optimization.
                     * On my machine, in Chrome 114, Windows, this is 
                     * - 1.5x faster than setPixelAbgr
                     * - 3x faster than setPixel
                     * - questionably faster than switch
                     * - faster than switch with imageData.data per byte access
                     */
                    data32[y * w + x] = colorMapAbgr[dropState.at(y + d, x)];
                }
            }

            for (const [dx, dy] of neighborhood) {
                if (
                    (Math.abs(dx) + Math.abs(dy) !== neighborhoodRadius)
                    && (Math.abs(dx) + Math.abs(dy) > 1)
                ) { continue; }
                const x = px + dx;
                const y = pt - d + dy;
                if (x < 0 || x >= w || y < 0 || y >= h) { continue; }

                setPixel(x, y, playerColor);
            }

            put();
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(
                canvas,
                0, 0, canvas.width / scale, canvas.height / scale,
                0, 0, canvas.width, canvas.height);
        };
        render();
        return () => cancelAnimationFrame(handle);
    }, [canvasRef.current, scale, dropState]);

    return <div {...props}>
        <canvas
            ref={canvasRef}
        />
    </div>;
}
