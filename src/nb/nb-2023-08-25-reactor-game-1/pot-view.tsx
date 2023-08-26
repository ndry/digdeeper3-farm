import { useLayoutEffect, useMemo, useRef } from "react";
import { jsx } from "@emotion/react";
import { LinkCaPreview } from "../nb-2023-08-13-reactor-game/link-ca-preview";
import { mutablePlantStates } from "./model";
import { createImageData32, cssColorToAbgr } from "../../utils/create-image-data32";


export const colorMap = [
    cssColorToAbgr("#ff0000"),
    cssColorToAbgr("#00ff00"),
    cssColorToAbgr("#0000ff"),
];


export function PotView({
    plantKey, renderTrigger, ...props
}: jsx.JSX.IntrinsicElements["div"] & {
    plantKey: string;
    renderTrigger: number;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const plant = mutablePlantStates.get(plantKey)!;

    const { imageData, imageData32 } = useMemo(() => {
        const imageData = new ImageData(500, 81);
        const imageData32 = createImageData32(imageData);
        return { imageData, imageData32 };
    }, []);

    useLayoutEffect(() => {
        if (!plant) { return; }

        const canvasEl = canvasRef.current;
        if (!canvasEl) { return; }
        const ctx = canvasEl.getContext("2d");
        if (!ctx) { return; }

        if (plant.spacetime === undefined) { return; }
        const offset = plant.spacetime.length - (imageData.width * 81);
        for (let t = 0; t < imageData.width; t++) {
            for (let x = 0; x < 81; x++) {
                const color = colorMap[plant.spacetime[offset + t * 81 + x]];
                imageData32.setPixelAbgr(t, x, color);
            }
        }




        // const t0 = plant.t - plant.spacetime.length;
        // for (let t = 0; t < plant.spacetime.length; t++) {
        //     for (let x = 0; x < plant.spacetime[t].length; x++) {
        //         const color = (plant.firstRepeatAt !== undefined
        //             && t === plant.firstRepeatAt - t0 + 1)
        //             ? 0
        //             : colorMap[plant.spacetime[t][x]];
        //         imageData32.setPixelAbgr(t, x, color);
        //     }
        // }

        canvasEl.width = imageData.width;
        canvasEl.height = imageData.height;
        ctx.putImageData(imageData, 0, 0);
    }, [renderTrigger, plantKey]);

    return <div {...props}>
        {plant && <>
            {plant.name}:
            <LinkCaPreview substance={plant.seed.rule} />
            &nbsp;/&nbsp;
            firstRepeatAt: {plant.firstRepeatAt}
            &nbsp;/&nbsp;
            t: {plant.t}
            <br />
            <canvas
                ref={canvasRef} />
        </>}
    </div>;
}
