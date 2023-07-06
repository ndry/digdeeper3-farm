import { useControls } from "leva";
import { run } from "./run";
import { version as caVersion } from "../../ca/version";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { createFullCanvasImageData32 } from "../../utils/create-image-data32";
import "@fontsource/noto-sans-mono";


export const colorMap = [
    "#8000ff", // empty
    "#000000", // wall
    "#80ff00", // energy
    "#a00000", // visited
] as const;
export const playerColor = "#ff0000ff";


export default function App() {
    const [renderTrigger, setRenderTrigger] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [selectedRunIndex, setSelectedRunIndex] = useState(0);

    function step(ticks: number) {
        for (const run of runs) {
            for (let i = 0; i < ticks; i++) {
                run.run.tick();
            }
        }
        setRenderTrigger(t => t + 1);
    }

    const {
        seed,
        scale,
        spaceSize,
        runCount,
    } = useControls({
        seed: { value: 4245, min: 1, max: 0xffffffff, step: 1 },
        scale: { value: 2, min: 1, max: 10, step: 1 },
        spaceSize: { value: 201, min: 2, max: 1000, step: 1 },
        runCount: { value: 40, min: 1, max: 2000, step: 1 },
    });

    const { runs } = useMemo(() => {
        const runs = Array.from({ length: runCount }, (_, i) => ({
            i,
            run: run({
                code: {
                    v: caVersion,
                    stateCount: 3,
                    rule: "299338136518556439977845337106716710210",
                },
                depthLeftBehind: 100,
                seed: seed + i * 10000,
                spaceSize,
                spacetimeSeed: seed,
                startFillState: 0,
                tickSeed: seed + i * 10000 + i * 2,
                stateMap: [2, 0, 1],
            }),
        }));

        return {
            runs,
        };
    }, [seed, spaceSize, runCount]);

    useLayoutEffect(() => {
        if (!isRunning) { return; }
        // const targetDt = 100;
        const targetDt = 1000 / 60;
        let lastDt = targetDt;
        let lastTicks = 100;

        const handle = setInterval(() => {
            lastTicks = Math.max(1, lastTicks * (targetDt / lastDt));
            const perfStart = performance.now();
            step(lastTicks);
            const perfEnd = performance.now();
            lastDt = perfEnd - perfStart;
            console.log({ "tick + setRenderTrigger": lastDt, lastTicks });
        }, targetDt * 1.1);
        return () => clearInterval(handle);
    }, [runs, isRunning]);
    const selectedRunWithNum = runs[selectedRunIndex];

    const soretedRuns = [...runs]
        .sort((a, b) =>
            (b.run.maxDepth - a.run.maxDepth)
            || (b.run.speed - a.run.speed));


    const canvasRef = useRef<HTMLCanvasElement>(null);
    useLayoutEffect(() => {
        if (!selectedRunWithNum) { return; }
        const canvas = canvasRef.current;
        if (!canvas) { return; }


        const selectedRun = selectedRunWithNum.run;

        const w = spaceSize;
        const h = 300;
        canvas.width = w;
        canvas.height = h;
        const {
            ctx,
            put,
            setPixel,
        } = createFullCanvasImageData32(canvas);


        let handle: number;
        const render = () => {
            canvas.width = w;
            canvas.height = h;
            const d = selectedRun.depth;
            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    setPixel(x, y, colorMap[selectedRun.at(y + d, x)]);
                }
            }

            const px = selectedRun.playerPositionX;
            const pt = selectedRun.playerPositionT;
            for (let dx = -2; dx <= 2; dx++) {
                for (let dy = -2; dy <= 2; dy++) {
                    const x = px + dx;
                    const y = pt - d + dy;
                    if (x < 0 || x >= w || y < 0 || y >= h) { continue; }

                    setPixel(x, y, playerColor);
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


            // handle = requestAnimationFrame(render);
        };
        render();
        // return () => cancelAnimationFrame(handle);

    }, [canvasRef.current, seed, scale, selectedRunWithNum, renderTrigger]);

    return <div css={[{
        fontFamily: "'Noto Sans Mono', monospace",
        fontSize: "0.7em",
        color: "#00ff11",

        display: "flex",
        flexDirection: "row",
    }, /*css*/`
        & button {
            padding: 0px;
            border: none;
            color: #00ff11;
            background: #00ff1150;
            font-family: 'Noto Sans Mono', monospace;
            font-size: 1em;
        }
        & button::before {
            content: "[\\00a0\\00a0";
        }
        & button::after {
            content: "\\00a0\\00a0]";
        }
        & button.short::before {
            content: "[";
        }
        & button.short::after {
            content: "]";
        }
    `]}>
        <canvas
            ref={canvasRef}
            css={{ height: "100%" }}
        />
        <div>
            <button onClick={() => setIsRunning(!isRunning)}>
                {isRunning ? "pause" : "play"}
            </button>
            &nbsp;
            {!isRunning && <>
                <button
                    onClick={() => step(1000)}
                >step</button>
                &nbsp;
            </>}
            <br />
            renderTrigger: {renderTrigger} / tickCount: {runs[0].run.tickCount}
            {soretedRuns.map(({ run, i }) => {
                return <div
                    key={i}
                    css={[{
                        background: selectedRunIndex === i
                            ? "#00ff1140"
                            : "transparent",
                        cursor: "pointer",
                    }, /*css*/` &:hover { background: #00ff1160; }`]}
                    onClick={() => setSelectedRunIndex(i)}
                >
                    {i.toString().padStart(4, ".")}:
                    &nbsp;
                    <span css={{ color: "#00ff1190" }}>maxDepth: </span>
                    <span css={{
                        background:
                            run.maxDepth === selectedRunWithNum.run.maxDepth
                                ? "rgba(47, 255, 0, 0.13)"
                                : "transparent",
                    }}>
                        {run.maxDepth.toString().padStart(4, ".")}
                    </span>
                    &nbsp;/&nbsp;
                    <span css={{ color: "#00ff1190" }}>depth: </span>
                    {run.depth.toString().padStart(4, ".")}
                    &nbsp;/&nbsp;
                    <span css={{ color: "#00ff1190" }}>speed: </span>
                    {run.speed.toExponential(2)}
                </div>;
            })}
        </div>
    </div >;
}