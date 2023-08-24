import { ForwardedRef, RefObject, forwardRef, useLayoutEffect, useMemo, useRef } from "react";
import type { jsx } from "@emotion/react";
import { createFullCanvasImageData32 } from "../../utils/create-image-data32";
import { getEnergyDelta } from "./get-energy-delta";

export const colorMap = [
    "#ff0000",
    "#00ff00",
    "#0000ff",
] as const;

export const SpacetimeCanvas = forwardRef((
    {
        spacetime,
        onSpaceSelected,
        css: cssProp,
        ...props
    }: {
        spacetime: number[][],
        onSpaceSelected?: (t: number) => void,
    } & jsx.JSX.IntrinsicElements["canvas"],
    ref: ForwardedRef<HTMLCanvasElement>,
) => {
    const innerRef = useRef<HTMLCanvasElement>();
    const setRef = (el: HTMLCanvasElement) => {
        if (typeof ref === "function") { ref(el); }
        else if (ref) { ref.current = el; }
        innerRef.current = el;
    };

    const scale = 3;



    useLayoutEffect(() => {
        const canvasEl = innerRef.current;
        if (!canvasEl) { return; }

        const w = spacetime.length;
        const h = spacetime[0].length + 5;
        const pixelsPerCell = 1;
        canvasEl.width = w * pixelsPerCell;
        canvasEl.height = h * pixelsPerCell;
        const {
            ctx,
            put,
            setPixel,
        } = createFullCanvasImageData32(canvasEl);

        for (let y = 0; y < spacetime[0].length; y++) {
            for (let x = 0; x < spacetime.length; x++) {
                setPixel(x, y, colorMap[spacetime[x][y]]);
            }
        }
        for (let x = 2; x < spacetime.length; x++) {
            const energyDelta = getEnergyDelta(spacetime[x], spacetime[x - 1]);
            const color = energyDelta > 0
                ? "#00ff00"
                : energyDelta === 0
                    ? "#ffff00"
                    : "#ff0000";
            setPixel(x, spacetime[0].length + 1, color);

        }

        canvasEl.width *= scale;
        canvasEl.height *= scale;

        put();
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(
            canvasEl,
            0, 0, canvasEl.width / scale, canvasEl.height / scale,
            0, 0, canvasEl.width, canvasEl.height);

    }, [spacetime]);

    return <canvas
        ref={setRef}
        onMouseMove={e => {
            const t = Math.floor(e.nativeEvent.offsetX / scale) - 2;
            onSpaceSelected?.(t);
        }}
        css={[{ imageRendering: "pixelated" }, cssProp]}
        {...props}
    />
});