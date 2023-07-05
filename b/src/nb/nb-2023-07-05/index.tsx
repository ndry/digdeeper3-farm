import { useLayoutEffect, useRef } from "react";
import { version as caVersion } from "../../ca/version";
import { createFullCanvasImageData32 } from "../../utils/create-image-data32";
import { createSpacetimeEvaluator } from "../../ca/create-spacetime-evaluator";
import { useControls } from "leva";

const code = {
    v: caVersion,
    stateCount: 3,
    rule: "125432894114651584386512079219058453323",
}

export const colorMap = [
    "#8000ff", // empty
    "#000000", // wall
    "#80ff00", // empty
] as const;


export default function () {
    const {
        seed,
        scale,
        spaceSize,
    } = useControls({
        seed: { value: 4242, min: 1, max: 0xffffffff, step: 1 },
        scale: { value: 4, min: 1, max: 10, step: 1 },
        spaceSize: { value: 61, min: 2, max: 1000, step: 1 },
    });

    const canvasRef = useRef<HTMLCanvasElement>(null);
    useLayoutEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;


        const w = spaceSize;
        const h = 200;
        const pixelsPerCell = 1;
        canvas.width = w * pixelsPerCell;
        canvas.height = h * pixelsPerCell;
        const {
            ctx,
            put,
            setPixel,
        } = createFullCanvasImageData32(canvas);


        const theCa = createSpacetimeEvaluator({
            code,
            spaceSize,
            timeSize: w,
            startFillState: 0,
            seed,
        });

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                setPixel(x, y, colorMap[theCa._at(y, x)]);
            }
        }

        canvas.width *= scale;
        canvas.height *= scale;

        put();
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(
            canvas,
            0, 0, canvas.width / scale, canvas.height / scale,
            0, 0, canvas.width, canvas.height);

    }, [canvasRef.current, seed, scale, spaceSize]);

    return <div>
        <canvas ref={canvasRef} />
    </div>;
}