import { useEffect, useMemo, useState } from "react";
import { retroThemeCss } from "../nb-2023-07-06/retro-theme-css";
import jsonBeautify from "json-beautify";
import update from "immutability-helper";
import { HmacSHA256, SHA256, enc } from "crypto-js";
import { jsx } from "@emotion/react";
import { JsonButton } from "../nb-2023-08-13-reactor-game/json-button";
import { Rule, keyifyTable, parseTable } from "../../ca237v1/rule-io";
import { getFullCombinedState } from "../../ca237v1/get-full-combined-state";
import { stateCount } from "../../ca237v1/state-count";
import { createAutoRecipe } from "../nb-2023-08-13-reactor-game/create-auto-recipe";
import { s0 } from "../nb-2023-08-13-reactor-game/s0";
import { ca237v1FromSeed } from "../nb-2023-08-13-reactor-game/ca237v1-from-seed";
import { rrr } from "../nb-2023-08-13-reactor-game/run-reactor";
import { LinkCaPreview } from "../nb-2023-08-13-reactor-game/link-ca-preview";


const asciiStateMap = ["·", "ı", "x"] as const;

export const scoreSubstance = (substance: Rule, target: Rule) => {
    const t1 = parseTable(substance);
    const t2 = parseTable(target);
    let score = 0;
    for (let i = 0; i < t1.length; i++) {
        score += t1[i] === t2[i] ? 1 : 0;
    }
    return score;
};

export function SubstanceView({
    substance,
    scoreTarget,
    ...props
}: jsx.JSX.IntrinsicElements["span"] & {
    substance: Rule,
    scoreTarget?: Rule,
}) {
    const padLen = 47 - substance.length;
    const pad = Array.from({ length: padLen }, () => ".").join("");
    return <span {...props}>
        {pad}
        <LinkCaPreview link={"./notes/?" + (() => {
            const s = new URLSearchParams();
            s.set("filter", JSON.stringify({ tags: substance }));
            return s.toString();

        })()}
            rule={substance}
        />
        &nbsp;/&nbsp;
        {parseTable(substance).map(d => asciiStateMap[d])}
        {scoreTarget && <>&nbsp;/&nbsp;{scoreSubstance(substance, scoreTarget).toString()}</>}
    </span>;
}

export function ReactionView({
    rule, reagent1, reagent2, t,
    scoreTarget,
}: {
    rule: Rule, reagent1: Rule, reagent2: Rule, t: number,
    scoreTarget?: Rule,
}) {
    const table = parseTable(rule);
    const spacetime = [
        parseTable(reagent1),
        parseTable(reagent2),
    ];

    while (spacetime.length < t + 2) {
        const prevSpace = spacetime[spacetime.length - 2];
        const space = spacetime[spacetime.length - 1];
        const nextSpace = space.map((_, x) => table[getFullCombinedState(
            stateCount,
            space.at(x - 1)!,
            space[x],
            space.at(x - space.length + 1)!,
            prevSpace[x])]);
        spacetime.push(nextSpace);
    }

    return <div
        css={{
            border: "1px solid #00ff0044",
            padding: "0.5em",
        }}
    >

        Reaction: <br />
        &#x2B4D;<SubstanceView substance={rule} />
        <br />
        <br />
        {spacetime.map((space, i) => <div key={i}>
            &#x269B;
            <SubstanceView
                substance={keyifyTable(space)}
                scoreTarget={scoreTarget}
            />
        </div>)}
    </div>;
}

export const createWorld = ({
    soup,
}: {
    soup: Rule[],
}) => ({
    t: 0,
    creatures: [] as Array<{
        rule: Rule,
        energy: number,
        seed: number,
    }>,
    soup,
});
export const tickInPlace = (worldState: {
    t: number;
    creatures: Array<{
        rule: Rule,
        energy: number,
        seed: number,
    }>,
    soup: Rule[],
}) => {
    if (worldState.soup.shift()) {
        worldState.creatures.push({
            rule: ca237v1FromSeed(SHA256("creature." + worldState.t)),
            energy: 27,
            seed: 0,
        });
    }
    for (let i = worldState.creatures.length - 1; i >= 0; i--) {
        const c = worldState.creatures[i];
        const s = worldState.soup.shift();
        const score = s ? scoreSubstance(s, c.rule) : 0;
        if (s) {
            const sTable = parseTable(s);
            const cTable = parseTable(c.rule);
            const eTable = Array.from(sTable);
            for (let i = 0; i < eTable.length; i++) {
                eTable[i] =
                    sTable[i] === cTable[i]
                        ? (sTable[i] + (1 + c.seed % 2)) % 3
                        : sTable[i];
            }
            worldState.soup.push(keyifyTable(eTable));
        }
        c.energy += score - 20;
        if (c.energy > 81 * 4) {
            worldState.creatures.push({
                rule: c.rule,
                energy: 81,
                seed: c.seed + 1,
            });
            worldState.creatures.push({
                rule: c.rule,
                energy: 81,
                seed: c.seed + 2,
            });
            c.energy -= 81 * 3;
        } else if (c.energy <= 0) {
            worldState.creatures.splice(i, 1);
            worldState.soup.push(c.rule);
        }
    }
    worldState.t++;
};



export default function Component() {
    const [isPaused, setIsPaused] = useState(false);
    const [renderTrigger, setRenderTrigger] = useState(0);
    const s1 = useMemo(() => ca237v1FromSeed(SHA256("s1")), []);
    const world = useMemo(() => createWorld({
        soup: Array.from({ length: 1000 }, () => s0),
    }), []);
    useEffect(() => {
        if (isPaused) { return; }
        const h = setInterval(() => {
            tickInPlace(world);
            setRenderTrigger(renderTrigger => renderTrigger + 1);
        }, 50);
        return () => clearInterval(h);
    }, [world, isPaused]);

    const creaturesStats = world.creatures.reduce((acc, c) => {
        acc[c.rule] = (acc[c.rule] || 0) + 1;
        return acc;
    }, {} as Record<Rule, number>);
    const creaturesStatsSorted: [Rule, number][] =
        Object.entries(creaturesStats).sort((a, b) => b[1] - a[1]);

    const soupStats = world.soup.reduce((acc, c) => {
        acc[c] = (acc[c] || 0) + 1;
        return acc;
    }, {} as Record<Rule, number>);
    const soupStatsSorted: [Rule, number][] =
        Object.entries(soupStats).sort((a, b) => b[1] - a[1]);

    return (
        <div css={[{
            fontSize: "0.71em",
            // display: "flex",
            // flexDirection: "column",
            padding: "1em",
        }, retroThemeCss]}>
            Hello World from {import.meta.url}
            <br />
            <button onClick={() => setIsPaused(isPaused => !isPaused)}>
                {isPaused ? "|>" : "||"}
            </button>
            <br />
            render: {renderTrigger}
            <br />
            t: {world.t}
            <br />
            creatures:
            {creaturesStatsSorted.map(([rule, count]) => <div key={rule}>
                <SubstanceView substance={rule} /> x {count}
            </div>)}
            soup:
            {soupStatsSorted.map(([rule, count]) => <div key={rule}>
                <SubstanceView substance={rule} /> x {count}
            </div>)}
            <JsonButton obj={world} name="world" />
        </div >
    );
}
