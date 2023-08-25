import { useLayoutEffect, useMemo, useRef } from "react";
import { retroThemeCss } from "../nb-2023-07-06/retro-theme-css";
import { SHA256 } from "crypto-js";
import { jsx } from "@emotion/react";
import { Rule, keyifyTable, parseTable } from "../../ca237v1/rule-io";
import { ca237v1FromSeed } from "../nb-2023-08-13-reactor-game/ca237v1-from-seed";
import { LinkCaPreview } from "../nb-2023-08-13-reactor-game/link-ca-preview";
import { createImageData32, cssColorToAbgr } from "../../utils/create-image-data32";
import { getFullCombinedState } from "../../ca237v1/get-full-combined-state";

const start0 = ca237v1FromSeed(SHA256("start0"));
const start1 = ca237v1FromSeed(SHA256("start1"));

const colorMap = [
    cssColorToAbgr("#ff0000"),
    cssColorToAbgr("#00ff00"),
    cssColorToAbgr("#0000ff"),
];

export function calcutateRule(rule: Rule) {
    const spaceSet = new Set<Rule>([start0, start1]);
    let firstRepeatAt = Infinity;

    const tCap = 2000;

    const imageData = new ImageData(tCap, 81);
    const imageData32 = createImageData32(imageData);

    const table = parseTable(rule);
    let prevPrev = parseTable(start0);
    let prev = parseTable(start1);

    for (let x = 0; x < prevPrev.length; x++) {
        imageData32.setPixelAbgr(0, x, colorMap[prevPrev[x]]);
        imageData32.setPixelAbgr(1, x, colorMap[prev[x]]);
    }

    let space = prev.map(() => 0);
    for (let t = 2; t < tCap; t++) {
        for (let x = 0; x < prev.length; x++) {
            space[x] = table[getFullCombinedState(
                3,
                prev[(x - 1 + prev.length) % prev.length],
                prev[x],
                prev[(x + 1) % prev.length],
                prevPrev[x],
            )];
            imageData32.setPixelAbgr(t, x,
                t === firstRepeatAt + 1 ? 0 : colorMap[space[x]]);
        }

        const r = keyifyTable(space);
        if (spaceSet.has(r)) {
            if (t < firstRepeatAt) {
                firstRepeatAt = t;
            }
        } else {
            spaceSet.add(r);
        }

        [prevPrev, prev, space] = [prev, space, prevPrev];
    }


    return {
        firstRepeatAt,
        imageData,
    };
}

export function RuleView({
    name,
    rule,
    imageData,
    firstRepeatAt,
    ...props
}: jsx.JSX.IntrinsicElements["div"] & ReturnType<typeof calcutateRule> & {
    name: string,
    rule: Rule,
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useLayoutEffect(() => {
        const canvasEl = canvasRef.current;
        if (!canvasEl) { return; }
        const ctx = canvasEl.getContext("2d");
        if (!ctx) { return; }
        canvasEl.width = imageData.width;
        canvasEl.height = imageData.height;
        ctx.putImageData(imageData, 0, 0);
    }, [imageData]);

    return <div {...props}>
        {name}:
        <LinkCaPreview substance={rule} />
        &nbsp;/&nbsp;
        firstRepeatAt: {firstRepeatAt}
        <br />
        <canvas
            ref={canvasRef}
        />
    </div>;
}

export default function Component() {
    const rootSeed = "target." + 0;
    const rules = useMemo(
        () => Array.from({ length: 100 }, (_, i) => {
            const seed = rootSeed + "." + i;
            const rule = ca237v1FromSeed(SHA256(seed));
            const calc = calcutateRule(rule);
            return {
                rule,
                seed,
                ...calc,
            };
        }).sort((a, b) => a.firstRepeatAt - b.firstRepeatAt),
        [rootSeed],
    );


    return (
        <div css={[{
            fontSize: "0.71em",
            // display: "flex",
            // flexDirection: "column",
            padding: "1em",
        }, retroThemeCss]}>
            Hello World from {import.meta.url}
            <br />
            {rules.map((x, i) => <div>
                <RuleView name={x.seed} key={i} {...x} />
            </div>)}
        </div >
    );
}