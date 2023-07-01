import Jimp from "jimp";
import { promises as fs } from "fs";
import path from "path";
import { LehmerPrng } from "./utils/lehmer-prng";
import { tuple } from "./utils/tuple";
import { Code } from "./ca/code";
import { parseFullTransitionLookupTable } from "./ca";
import { fillSpace } from "./ca/fill-space";
import { _never } from "./utils/_never";
import { AccumulatedMap, getLeafIndex, neighborhoods, offer, processStep, windowLengths } from "./copilot";


export const timeSizeToRender = 300;


export const forward = 0;
export const left = 1;
export const right = 2;
export const backward = 3;

export const directionVec = {
    [forward]: [0, 1],
    [left]: [-1, 0],
    [right]: [1, 0],
    [backward]: [0, -1],
};

export const colors = [
    0xffffffff, // empty
    0x000000ff, // wall
    0x0000ffff, // energy
];
export const playerColor = 0xff0000ff;


/**
 * Run is a single run of a single agent in a single dropzone.
 * It handles all the state by iteself.
 * Its state is mutable.
 *
 *
 * CA states interpretation:
 * 0 - empty
 * 1 - wall
 * 2 - energy
 */
export function createRun({
    runId, programPathabeDate,
    code, spaceSize, startFillState, spacetimeSeed, tickSeed, copilotMap,
}: {
    runId: string;
    programPathabeDate: string;
    code: Code;
    spaceSize: number;
    startFillState: number;
    spacetimeSeed: number;
    tickSeed: number;
    copilotMap: AccumulatedMap;
}) {
    const { stateCount } = code;
    const table = parseFullTransitionLookupTable(code);
    const spacetimeRandom = new LehmerPrng(spacetimeSeed);

    /**
     * Spacetime is evolved per request
     * and cell are mutable (energy or walls would become empty)
     */
    const spacetime = [
        Array.from({ length: spaceSize }, () => startFillState),
        Array.from({ length: spaceSize }, () => spacetimeRandom.next() % stateCount),
        Array.from({ length: spaceSize }, () => spacetimeRandom.next() % stateCount),
    ];

    const ensureSpacetime = (t: number) => {
        while (t >= spacetime.length) {
            const space = Array.from({ length: spaceSize }, () => 0);
            space[0] = spacetimeRandom.next() % stateCount;
            space[space.length - 1] = spacetimeRandom.next() % stateCount;
            spacetime.push(space);
            fillSpace(
                stateCount,
                spacetime[spacetime.length - 3],
                spacetime[spacetime.length - 2],
                spacetime[spacetime.length - 1],
                table);
        }
    };

    const at = (t: number, x: number) => {
        ensureSpacetime(t);
        return spacetime[t][x];
    };
    const atWithBounds = (t: number, x: number) => {
        if (t < 0) { return stateCount + 1; }
        if (x < 0 || x >= spaceSize) { return stateCount + 1; }
        return at(t, x);
    };


    const currentCopilotStates = [] as number[][];
    const currentCopilotMap =
        JSON.parse(JSON.stringify(copilotMap)) as AccumulatedMap;

    for (let ni = 0; ni < neighborhoods.length; ni++) {
        for (let wi = 0; wi < windowLengths.length; wi++) {
            const li = getLeafIndex(wi, ni);
            currentCopilotStates[li] = [];
            currentCopilotMap[li] = {};
        }
    }

    const playerPosition: [number, number] = [
        Math.floor(spaceSize / 2),
        0,
    ];
    let playerEnergy = 3;
    let maxDepth = 0;
    let tickCount = 0;
    const tickRandom = new LehmerPrng(tickSeed);
    const tick = () => {
        tickCount++;
        const possibleDirections = ([forward, left, right, backward] as const)
            .filter(d => {
                const [dx, dt] = directionVec[d];
                const [x, t] = playerPosition;
                const [nx, nt] = tuple(x + dx, t + dt);
                if (nt < 0) { return false; }
                if (nx < 1 || nx >= spaceSize - 1) { { return false; } }
                const s = at(nt, nx);
                if (s === 0) { return true; } // empty
                if (s === 2) { return true; } // energy
                if (s === 1) { return playerEnergy >= 9; } // wall
                return _never();
            });

        if (possibleDirections.length === 0) {
            console.log("Game over: No possible directions");
            return false;
        }

        const theOffer = offer(
            currentCopilotStates,
            copilotMap);

        let direction: 0 | 1 | 2 | 3;
        if (tickRandom.nextFloat() < 1) {
            if (theOffer) {
                const sorted = theOffer
                    .map((v, i) => [i as 0 | 1 | 2 | 3, v] as const)
                    .filter(([i]) => possibleDirections.includes(i))
                    .sort((a, b) => b[1] - a[1]);
                if (sorted[0][1] > 5) {
                    // console.log("Copilot is sure");
                    const maxes = sorted.filter(([, v]) => v === sorted[0][1]);
                    direction = maxes[tickRandom.next() % maxes.length][0];
                } else {
                    direction = possibleDirections[tickRandom.next() % possibleDirections.length];
                }
            } else {
                direction = possibleDirections[tickRandom.next() % possibleDirections.length];
            }
        } else {
            direction = possibleDirections[tickRandom.next() % possibleDirections.length];
        }

        for (let ni = 0; ni < neighborhoods.length; ni++) {
            for (let wi = 0; wi < windowLengths.length; wi++) {
                const li = getLeafIndex(wi, ni);
                processStep(
                    currentCopilotStates[li],
                    currentCopilotMap[li],
                    stateCount,
                    playerPosition,
                    atWithBounds,
                    windowLengths[wi],
                    neighborhoods[ni],
                    direction);
            }
        }

        playerPosition[0] += directionVec[direction][0];
        playerPosition[1] += directionVec[direction][1];
        const s = at(playerPosition[1], playerPosition[0]);
        if (s === 2) { playerEnergy++; }
        if (s === 1) { playerEnergy -= 9; }
        spacetime[playerPosition[1]][playerPosition[0]] = 0;
        maxDepth = Math.max(maxDepth, playerPosition[1]);

        return true;
    };


    const render = async () => {
        const i = tickCount;
        const image = await Jimp.create(new Jimp(timeSizeToRender, spaceSize));
        for (let t = 0; t < timeSizeToRender; t++) {
            for (let x = 0; x < spaceSize; x++) {
                image.setPixelColor(colors[at(t, x)], t, x);
            }
        }

        image.setPixelColor(
            playerColor,
            playerPosition[1], playerPosition[0]);

        const p = path.join(
            "output",
            `grun_${programPathabeDate}`,
            `rule_${code.rule}`,
            `zone_${spacetimeSeed.toString()}`,
            `run_${runId}`,
            `${i}_md${maxDepth}.png`);
        await fs.mkdir(path.dirname(p), { recursive: true });
        await image.writeAsync(p);
        console.log(`Wrote ${p}`);
    };

    return {
        tick,
        render,
        stats() {
            return {
                maxDepth,
                copilotMap: currentCopilotMap,
            }
        }
    };
}
