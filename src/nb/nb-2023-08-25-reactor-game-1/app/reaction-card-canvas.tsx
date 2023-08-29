import { useLayoutEffect, useMemo, useRef } from "react";
import { jsx } from "@emotion/react";
import { createImageData32, cssColorToAbgr } from "../../../utils/create-image-data32";
import { fillPrestartedSpacetime81Pbc } from "../model/fill-prestarted-spacetime81-pbc";


export const colorMap = [
    cssColorToAbgr("#ff0000"),
    cssColorToAbgr("#00ff00"),
    cssColorToAbgr("#0000ff"),
];


export function ReactionCardCanvas({
    last281, table, ...props
}: jsx.JSX.IntrinsicElements["canvas"] & {
    last281: Uint8Array,
    table: number[]
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const { imageData, imageData32, spacetime } = useMemo(() => {
        const imageData = new ImageData(500, 81);
        const imageData32 = createImageData32(imageData);
        const spacetime = new Uint8Array(imageData.width * 81);
        return { imageData, imageData32, spacetime };
    }, []);

    useLayoutEffect(() => {
        const canvasEl = canvasRef.current;
        if (!canvasEl) { return; }
        const ctx = canvasEl.getContext("2d");
        if (!ctx) { return; }

        spacetime.set(last281);
        fillPrestartedSpacetime81Pbc(spacetime, table);

        for (let t = 0; t < imageData.width; t++) {
            for (let x = 0; x < 81; x++) {
                const color = colorMap[spacetime[t * 81 + x]];
                imageData32.setPixelAbgr(t, x, color);
            }
        }

        canvasEl.width = imageData.width;
        canvasEl.height = imageData.height;
        ctx.putImageData(imageData, 0, 0);
    }, [last281, table, imageData32, spacetime]);

    return <canvas ref={canvasRef} {...props} />;
}
