import { run } from "./run";
import { useLayoutEffect, useRef } from "react";
import { createFullCanvasImageData32 } from "../../utils/create-image-data32";
import { jsx } from "@emotion/react";
import { neighborhood, neighborhoodRadius } from "./neural-walker";


export const colorMap = [
    "#8000ff", // empty
    "#000000", // wall
    "#80ff00", // energy
    "#a00000", // visited
] as const;
export const playerColor = "#ff0000ff";

export function RunSightView({
    scale, run1, ...props
}: jsx.JSX.IntrinsicElements["div"] & {
    scale: number;
    run1: ReturnType<typeof run>;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useLayoutEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) { return; }

        const w = run1.args.dropzone.spaceSize;
        const h = 300;
        canvas.width = w;
        canvas.height = h;
        const {
            ctx, put, setPixel,
        } = createFullCanvasImageData32(canvas);


        // let handle: number;
        const render = () => {
            canvas.width = w;
            canvas.height = h;
            const stats = run1.stats;
            const {
                depth: d, playerPositionX: px, playerPositionT: pt,
            } = stats;
            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    setPixel(x, y, colorMap[run1.at(y + d, x)]);
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

            canvas.width *= scale;
            canvas.height *= scale;

            put();
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(
                canvas,
                0, 0, canvas.width / scale, canvas.height / scale,
                0, 0, canvas.width, canvas.height);


            // handle = requestAnimationFrame(render);
        };
        render();
        // return () => cancelAnimationFrame(handle);
    }, [canvasRef.current, scale, run1, run1.stats.tickCount]);

    return <div {...props}>
        <canvas
            ref={canvasRef}
        />
    </div>;
}
