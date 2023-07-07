import { useControls } from "leva";
import { run } from "./run";
import { version as caVersion } from "../../ca/version";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { createFullCanvasImageData32 } from "../../utils/create-image-data32";
import "@fontsource/noto-sans-mono";
import jsonBeautify from "json-beautify";


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
        const dropzone = {
            code: {
                v: caVersion,
                stateCount: 3,
                rule: "299338136518556439977845337106716710210",
            },
            depthLeftBehind: 100,
            spaceSize,
            seed,
            startFillState: 0,
            stateMap: [2, 0, 1],
        } as const;
        const runs = Array.from({ length: runCount }, (_, i) => ({
            i,
            run: run({
                dropzone,
                tickSeed: seed + i * 10000 + i * 2,
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
            (b.run.stats.maxDepth - a.run.stats.maxDepth)
            || (b.run.stats.speed - a.run.stats.speed));


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


        // let handle: number;
        const render = () => {
            canvas.width = w;
            canvas.height = h;
            const stats = selectedRun.stats;
            const {
                depth: d,
                playerPositionX: px,
                playerPositionT: pt,
            } = stats;
            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    setPixel(x, y, colorMap[selectedRun.at(y + d, x)]);
                }
            }

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
            renderTrigger: {renderTrigger} / tickCount: {runs[0].run.stats.tickCount}
            <table css={[{
                textAlign: "right",
                borderSpacing: "0px",
            }, /*css*/`
            & tr:nth-child(2n) {
                background: rgba(0, 255, 17, 0.07);
            }
        `]}>
                <thead>
                    <tr>
                        <th>..run</th>
                        <th>.maxDepth</th>
                        <th>...speed</th>
                        <th>.tickSeed</th>
                    </tr>
                </thead>
                <tbody>
                    {soretedRuns.map(({ run, i }) => {
                        const { args, stats } = run;
                        const {
                            tickSeed,
                        } = run.args;
                        const {
                            maxDepth,
                            speed,
                        } = stats;
                        return <tr
                            key={i}
                            css={[{
                                background: selectedRunIndex === i
                                    ? "#00ff1140"
                                    : "transparent",
                                cursor: "pointer",
                            }, /*css*/` &:hover { background: #00ff1160; }`]}

                            onClick={() => {
                                setSelectedRunIndex(i);
                                console.log({ i, run, args, stats });
                            }}
                            title={jsonBeautify({ args, stats }, null as any, 2, 80)}
                        >
                            <td>{i}</td>
                            <td
                                css={{
                                    background:
                                        maxDepth === selectedRunWithNum.run.stats.maxDepth
                                            ? "rgba(47, 255, 0, 0.13)"
                                            : "transparent",
                                }}
                            >{maxDepth}</td>
                            <td>{speed.toExponential(2)}</td>
                            <td>{tickSeed}</td>
                        </tr>;
                    })}
                </tbody>
            </table>
        </div>
    </div >;
}