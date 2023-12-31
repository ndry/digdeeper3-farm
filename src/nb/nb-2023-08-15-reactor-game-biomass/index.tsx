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
import { createAutoRecipe } from "../nb-2023-08-13-reactor-game/recipes/create-auto-recipe";
import { s0 } from "../nb-2023-08-13-reactor-game/s0";
import { ca237v1FromSeed } from "../nb-2023-08-13-reactor-game/ca237v1-from-seed";
import { rrr } from "../nb-2023-08-13-reactor-game/run-reactor";
import { LinkCaPreview } from "../nb-2023-08-13-reactor-game/link-ca-preview";


const asciiStateMap = ["·", "ı", "x"] as const;

export const scoreSubstance = (
    table1: ReadonlyArray<number>,
    table2: ReadonlyArray<number>,
) => {
    let score = 0;
    let f = 1;
    for (let i = 0; i < table1.length; i++) {
        if (table1[i] !== table2[i]) {
            f = 1;
        } else {
            score += f;
            f *= 3;
        }
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
        <LinkCaPreview substance={substance} />
        &nbsp;/&nbsp;
        {parseTable(substance).map(d => asciiStateMap[d])}
        {scoreTarget && <>&nbsp;/&nbsp;{scoreSubstance(
            parseTable(substance),
            parseTable(scoreTarget),
        ).toString()}</>}
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
    tt: 0,
    creatures: [] as Array<{
        rule: Rule,
        _ruleTable: ReadonlyArray<number>,
        energy: number,
        seed: number,
    }>,
    soup: soup.map(s => ({
        rule: s,
        _ruleTable: parseTable(s),
    })),
});
export const tickInPlace = (worldState: {
    t: number;
    tt: number;
    creatures: Array<{
        rule: Rule,
        _ruleTable: ReadonlyArray<number>,
        energy: number,
        seed: number,
    }>,
    soup: Array<{
        rule: Rule,
        _ruleTable: ReadonlyArray<number>,
    }>,
}, cTicks: number) => {
    const random01 = Math.random;
    const se = 81 * 81 * 3;

    const newSoup = [] as Array<{
        rule: Rule,
        _ruleTable: ReadonlyArray<number>,
    }>;

    const _cTicks = Math.min(cTicks, worldState.creatures.length);

    if (random01() < (_cTicks + 1) / (worldState.creatures.length + 1)) {
        if (worldState.soup.shift()) {
            const rule = ca237v1FromSeed(SHA256("rule." + worldState.t));
            worldState.creatures.push({
                rule,
                _ruleTable: parseTable(rule),
                energy: se,
                seed: 0,
            });
        }
    }

    for (let _ct = _cTicks - 1; _ct >= 0; _ct--) {
        worldState.tt++;
        const i = _cTicks === cTicks
            ? _ct
            : Math.floor(random01() * worldState.creatures.length);
        const c = worldState.creatures[i];

        let s = worldState.soup[0];
        if (s) {

            for (let j = 1; j < Math.min(worldState.soup.length, 81); j++) {
                const sj = worldState.soup[j];
                const score1 = scoreSubstance(c._ruleTable, s._ruleTable);
                const score2 = scoreSubstance(c._ruleTable, sj._ruleTable);
                if (score2 > score1) {
                    s = sj;
                }
            }
            worldState.soup.splice(worldState.soup.indexOf(s), 1);
        }

        let score = 0;
        let f = 1;
        if (s) {
            const sTable = s._ruleTable;
            const cTable = c._ruleTable;
            const eTable = [...sTable];
            for (let i = 0; i < eTable.length; i++) {
                if (sTable[i] === cTable[i]) {
                    score += f;
                    f *= 3;
                    eTable[i] = (sTable[i] + 1 + (c.seed % 2)) % 3;
                } else {
                    f = 1;
                }
            }
            newSoup.push({
                rule: keyifyTable(eTable),
                _ruleTable: eTable,
            });
        }
        c.energy += score - se / 3;
        if (c.energy > se * 81) {
            worldState.creatures.push({
                rule: c.rule,
                _ruleTable: c._ruleTable,
                energy: se,
                seed: c.seed + 1,
            });
            worldState.creatures.push({
                rule: c.rule,
                _ruleTable: c._ruleTable,
                energy: se,
                seed: c.seed + 2,
            });
            c.energy -= se * 72;
        } else if (c.energy <= 0) {
            worldState.creatures.splice(i, 1);
            const eTable = [...c._ruleTable];
            for (let i = 0; i < eTable.length; i++) {
                eTable[i] = (eTable[i] + 1 + (c.seed % 2)) % 3;
            }
            newSoup.push({
                rule: keyifyTable(eTable),
                _ruleTable: eTable,
            });
        }
    }
    worldState.soup.push(...newSoup);

    // shuffle soup
    for (let i = worldState.soup.length - 1; i > 0; i--) {
        const j = Math.floor(random01() * (i + 1));
        [worldState.soup[i], worldState.soup[j]] =
            [worldState.soup[j], worldState.soup[i]];
    }

    worldState.t++;
};

const isPausedParam = !!(new URLSearchParams(location.search).get("paused"));

export default function Component() {
    const [isPaused, setIsPaused] = useState(isPausedParam);
    const [renderTrigger, setRenderTrigger] = useState(0);
    const s1 = useMemo(() => ca237v1FromSeed(SHA256("s1")), []);
    const world = useMemo(() => createWorld({
        soup: Array.from({ length: 10000 }, () => s1),
    }), []);
    useEffect(() => {
        if (isPaused) { return; }
        let h: ReturnType<typeof setTimeout>;
        const tick = () => {
            for (let i = 0; i < 1; i++) {
                tickInPlace(world, 1000);
            }
            setRenderTrigger(renderTrigger => renderTrigger + 1);
            h = setTimeout(tick, 20);
        };
        tick();
        return () => clearInterval(h);
    }, [world, isPaused]);

    const creaturesStats = world.creatures.reduce((acc, c) => {
        acc[c.rule] = (acc[c.rule] || 0) + 1;
        return acc;
    }, {} as Record<Rule, number>);
    const creaturesStatsSorted: [Rule, number][] =
        Object.entries(creaturesStats).sort((a, b) => b[1] - a[1]);
    const creaturesCount = world.creatures.length;

    const soupStats = world.soup.reduce((acc, c) => {
        acc[c.rule] = (acc[c.rule] || 0) + 1;
        return acc;
    }, {} as Record<Rule, number>);
    const soupStatsSorted: [Rule, number][] =
        Object.entries(soupStats).sort((a, b) => b[1] - a[1]);
    const soupCount = world.soup.length;

    const rowLimit = 25;

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
            t: {world.t} / tt: {world.tt}
            <br />
            <JsonButton obj={world} name="world" doNotPrerenderTitle />
            <br />
            creatures ({creaturesCount}):
            {creaturesStatsSorted
                .slice(0, rowLimit)
                .map(([rule, count]) =>
                    <div key={rule}>
                        <SubstanceView substance={rule} /> x {count}
                    </div>)}
            {creaturesStatsSorted.length > rowLimit
                && <div>
                    ... ({creaturesStatsSorted.length - rowLimit} more rows)
                </div>}
            soup ({soupCount}):
            {soupStatsSorted
                .slice(0, rowLimit)
                .map(([rule, count]) =>
                    <div key={rule}>
                        <SubstanceView substance={rule} /> x {count}
                    </div>)}
            {soupStatsSorted.length > rowLimit
                && <div>
                    ... ({soupStatsSorted.length - rowLimit} more rows)
                </div>}
        </div >
    );
}
