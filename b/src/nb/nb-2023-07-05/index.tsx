import { useLayoutEffect, useRef } from "react";
import { version as caVersion } from "../../ca/version";
import { createFullCanvasImageData32 } from "../../utils/create-image-data32";
import { createSpacetimeEvaluator } from "../../ca/create-spacetime-evaluator";
import { useControls } from "leva";

const code = {
    v: caVersion,
    stateCount: 3,
    rule: "299995569439125313185844037724571538281",
}

export const colorMap = [
    "#ff0000",
    "#00ff00",
    "#0000ff",
] as const;


export default function () {
    const {
        seed,
        scale,
    } = useControls({
        seed: {
            value: 4242,
            min: 1,
            max: 0xffffffff,
            step: 1,
        },
        scale: {
            value: 3,
            min: 1,
            max: 10,
            step: 1,
        },
    });

    const canvasRef = useRef<HTMLCanvasElement>(null);
    useLayoutEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;


        const w = 61;
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
            spaceSize: h,
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

    }, [canvasRef.current, seed, scale]);

    return <div>
        <canvas ref={canvasRef} />
    </div>;
}