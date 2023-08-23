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
import { countCellMatches } from "./countCellMatches";


// a creature spontaneously emerges from soup
// a creature eats soup
// a creature reproduces
// a creature dies

// the energy is not conserved
// the quantity of soup+creatures is conserved


export type Creature = {
    rule: Rule,
    _ruleTable: ReadonlyArray<number>,
    energy: number,
    _reagentTables: []
    | [ReadonlyArray<number>]
    | [ReadonlyArray<number>, ReadonlyArray<number>],
}

const se = 81 * 3;
export const createCreature = (rule: Rule): Creature => ({
    rule,
    _ruleTable: parseTable(rule),
    energy: se,
    _reagentTables: [],
});

export const tickCreatureInPlace = (
    creature: Creature,
    world: {
        creatures: Array<Creature>,
        soup: Array<{ rule: Rule, _ruleTable: ReadonlyArray<number> }>,
    },
    newSoup: Array<{ rule: Rule, _ruleTable: ReadonlyArray<number> }>,
) => {
    creature.energy -= 50;

    if (!creature._reagentTables[0]) {
        const s = world.soup.shift()!;
        if (s) { creature._reagentTables[0] = s._ruleTable; }
    } else if (!creature._reagentTables[1]) {
        const s = world.soup.shift()!;
        if (s) { creature._reagentTables[1] = s._ruleTable; }
    } else {
        const table = creature._ruleTable;
        const prevSpace = creature._reagentTables[0];
        const space = creature._reagentTables[1];
        const nextSpace = space.map((_, x) => table[getFullCombinedState(
            stateCount,
            space.at(x - 1)!,
            space[x],
            space.at(x - space.length + 1)!,
            prevSpace[x])]);

        const c = countCellMatches(space, nextSpace);
        if (c <= 27) {
            creature.energy += c * 2;
        } else {
            creature.energy += (81 - c);
        }

        creature._reagentTables[0] = space;
        creature._reagentTables[1] = nextSpace;
    }

    if (creature._reagentTables[1]) {
        const s = creature._reagentTables[1];
        const c = countCellMatches(creature._ruleTable, s);
        const energyToReproduce = se + c;
        if (creature.energy >= se + energyToReproduce) {
            creature.energy -= energyToReproduce;
            world.creatures.push(createCreature(creature.rule));
            creature._reagentTables.pop();
        }
    }


    if (creature.energy < 0) {
        newSoup.push({
            rule: creature.rule, _ruleTable: creature._ruleTable,
        });
        if (creature._reagentTables[0]) {
            const t = creature._reagentTables[0];
            newSoup.push({ rule: keyifyTable(t), _ruleTable: t });
        }
        if (creature._reagentTables[1]) {
            const t = creature._reagentTables[1];
            newSoup.push({ rule: keyifyTable(t), _ruleTable: t });
        }
        world.creatures.splice(world.creatures.indexOf(creature), 1);
    }
};

const asciiStateMap = ["·", "ı", "x"] as const;

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
        {scoreTarget && <>&nbsp;/&nbsp;{countCellMatches(
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
}): Parameters<typeof tickInPlace>[0] => ({
    t: 0,
    tt: 0,
    creatures: [],
    soup: soup.map(s => ({
        rule: s,
        _ruleTable: parseTable(s),
    })),
});
export const tickInPlace = (worldState: {
    t: number;
    tt: number;
    creatures: Array<Creature>,
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
        const s = worldState.soup.shift();
        if (s) {
            worldState.creatures.push(createCreature(s.rule));
        }
    }

    for (let _ct = _cTicks - 1; _ct >= 0; _ct--) {
        worldState.tt++;
        const i = _cTicks === cTicks
            ? _ct
            : Math.floor(random01() * worldState.creatures.length);
        const c = worldState.creatures[i];
        tickCreatureInPlace(c, worldState, newSoup);
    }
    worldState.soup.push(...newSoup);

    // shuffle soup
    for (let i = worldState.soup.length - 1; i > 0; i--) {
        const j = Math.floor(random01() * (i + 1));
        [worldState.soup[i], worldState.soup[j]] =
            [worldState.soup[j], worldState.soup[i]];
    }

    worldState.t++;

    return _cTicks;
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
            const tc = 20_000;
            for (let i = 0; i < tc;) {
                i += tickInPlace(world, tc);
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
