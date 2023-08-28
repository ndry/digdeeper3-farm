import { useLayoutEffect, useMemo, useRef } from "react";
import { jsx } from "@emotion/react";
import { createImageData32, cssColorToAbgr } from "../../../utils/create-image-data32";
import { getMutableState } from "../model/perform-reactor-tick";
import { ReactionCard } from "../model/reaction-card";
import { prepareSpacetime81 } from "../model/prepare-spacetime81";
import { parseTable } from "../../../ca237v1/rule-io";
import { fillPrestartedSpacetime81UsingCyclicBorders } from "../model/fill-prestarted-spacetime81-using-cyclic-borders";


export const colorMap = [
    cssColorToAbgr("#ff0000"),
    cssColorToAbgr("#00ff00"),
    cssColorToAbgr("#0000ff"),
];


export function ReactionCardCanvas({
    reactionCard, ...props
}: jsx.JSX.IntrinsicElements["canvas"] & {
    reactionCard: ReactionCard;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const { imageData, imageData32 } = useMemo(() => {
        const imageData = new ImageData(500, 81);
        const imageData32 = createImageData32(imageData);
        return { imageData, imageData32 };
    }, []);

    useLayoutEffect(() => {
        const state = getMutableState("sdsd223").get(reactionCard.reactionSeed);
        const spacetime = state
            ? state.spacetime
            : (() => {
                const s = prepareSpacetime81(new Uint8Array([
                    ...parseTable(reactionCard.reactionSeed.reagent0),
                    ...parseTable(reactionCard.reactionSeed.reagent1),
                ]), imageData.width);
                fillPrestartedSpacetime81UsingCyclicBorders(
                    s, parseTable(reactionCard.reactionSeed.rule));
                return s;
            })();



        const canvasEl = canvasRef.current;
        if (!canvasEl) { return; }
        const ctx = canvasEl.getContext("2d");
        if (!ctx) { return; }

        if (spacetime === undefined) { return; }



        const startT = reactionCard.repeatAt === undefined
            ? reactionCard.t - imageData.width
            : reactionCard.repeatAt - imageData.width / 2;
        const startT0 = reactionCard.t - spacetime.length / 81;
        const repeatLineT = reactionCard.repeatAt === undefined
            ? -1
            : reactionCard.repeatAt - startT + 1;
        const offset = (startT - startT0) * 81;
        for (let t = 0; t < imageData.width; t++) {
            const i = offset + t * 81;
            if (i < 0 || i >= spacetime.length * 81) { continue; }
            for (let x = 0; x < 81; x++) {
                const color =
                    t === repeatLineT
                        ? 0
                        : colorMap[spacetime[i + x]];
                imageData32.setPixelAbgr(t, x, color);

            }
        }

        canvasEl.width = imageData.width;
        canvasEl.height = imageData.height;
        ctx.putImageData(imageData, 0, 0);
    }, [reactionCard]);

    return <canvas ref={canvasRef} {...props} />;
}
