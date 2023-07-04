import { useEffect, useRef } from "react";
import type { jsx } from "@emotion/react";
import { Star } from "@emotion-icons/ionicons-solid/Star";
import { useToggleRuleBookmark } from "./bookmarked-rules-recoil";
import { createFullCanvasImageData32 } from "../utils/create-image-data32";
import { Code, keyifyCode } from "../ca/code";
import { createSpacetimeEvaluator } from "../ca/create-spacetime-evaluator";

export const colorMap = [
    "#ff0000",
    "#00ff00",
    "#0000ff",
] as const;

export function RulePreview({
    code,
    css: cssProp,
    ...props
}: {
    showDetails?: boolean,
    additionalDetails?: string,
    code: Code,
} & jsx.JSX.IntrinsicElements["div"]) {
    const [isBookmarked, toggleBookmark] = useToggleRuleBookmark(code);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvasEl = canvasRef.current;
        if (!canvasEl) { return; }

        const w = 200;
        const h = 61;
        const pixelsPerCell = 1;
        canvasEl.width = w * pixelsPerCell;
        canvasEl.height = h * pixelsPerCell;
        const {
            ctx,
            put,
            setPixel,
        } = createFullCanvasImageData32(canvasEl);

        const theCa = createSpacetimeEvaluator({
            code,
            spaceSize: h,
            timeSize: w,
            startFillState: 0,
            seed: 4242,
        });

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                setPixel(x, y, colorMap[theCa._at(x, y)]);
            }
        }

        const scale = 2;
        canvasEl.width *= scale;
        canvasEl.height *= scale;

        put();
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(
            canvasEl,
            0, 0, canvasEl.width / scale, canvasEl.height / scale,
            0, 0, canvasEl.width, canvasEl.height);

    }, [canvasRef.current, code]);

    return <div
        css={[{
            display: "flex",
            flexDirection: "row",
        }, cssProp]}
        title={keyifyCode(code)}
        {...props}
    >
        <div css={{ position: "relative" }}>
            <div
                css={[{
                    position: "absolute",
                    margin: "3%",
                    top: 0,
                    right: 0,
                    borderRadius: "4px",
                    backgroundColor: "#A8E7D8",
                    padding: "0.5%",
                    width: "5%",
                }]}
            >
                <Star
                    onClick={toggleBookmark}
                    color={isBookmarked ? "#D84949" : "#444444"}
                    // css={[{ width: "100%" }]}
                />
            </div>
            <canvas ref={canvasRef} css={[{ imageRendering: "pixelated" }]} />
        </div>
    </div>;
}