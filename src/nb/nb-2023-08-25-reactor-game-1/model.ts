import { SHA256 } from "crypto-js";
import { Rule, parseTable } from "../../ca237v1/rule-io";
import { ca237v1FromSeed } from "../nb-2023-08-13-reactor-game/ca237v1-from-seed";
import { getFullCombinedState } from "../../ca237v1/get-full-combined-state";
import type * as CryptoJS from "crypto-js";
export type WordArray = CryptoJS.lib.WordArray;
import { HmacSHA256 } from "crypto-js";
import { CustomHashSet } from "../../utils/custom-hash-set";



const start0 = ca237v1FromSeed(SHA256("start0"));
const start1 = ca237v1FromSeed(SHA256("start1"));

export const mutablePlantStates = new Map<string, PlantState>();

export function createFarmState(seed: string) {
    const plantCap = 5;
    let plantIcrement = 0;
    const plantKeys = Array.from(
        { length: plantCap },
        () => {
            const rule = ca237v1FromSeed(HmacSHA256(
                "seed." + plantIcrement,
                seed));
            mutablePlantStates.set(rule,
                createPlantState(rule, seed.toString()));
            plantIcrement++;
            return rule;
        });
    return {
        seed: seed,
        plantIcrement,
        plantCap,
        plantKeys,
        collectedPlants: [] as any[], // CollectedPlantState[]
        money: 1000,
    };
}


export function createPlantState(rule: Rule, name: string) {
    const timeLen = 1500;
    return {
        name,
        seed: {
            rule,
            s0: start0,
            s1: start1,
        },
        t: 2,
        timeLen,
        sSet: CustomHashSet<number[], number>({
            hashFn: (table) => {
                let h = 0;
                let i = 0;
                for (; i < table.length - 16; i += 16) {
                    let h0 = 0;
                    for (let j = 0; j < 16; j++) {
                        h0 = (h0 << 2) + table[i + j];
                    }
                    h = h ^ h0;
                }
                {
                    let h0 = 0;
                    for (; i < table.length; i++) {
                        h0 = (h0 << 2) + table[i];
                    }
                    h = h ^ h0;
                }
                return h;
            },
            equalsFn: (a, b) => {
                if (a.length !== b.length) { return false; }
                for (let i = 0; i < a.length; i++) {
                    if (a[i] !== b[i]) { return false; }
                }
                return true;
            },
            verbose: true,
        }),
        sList: [] as number[][],
        table: parseTable(rule),
        spacetime: [
            parseTable(start0),
            parseTable(start1),
        ],
        firstRepeatAt: undefined as number | undefined,
    };
}
type PlantState = ReturnType<typeof createPlantState>;

export function updatePlantStateInPlace(state: PlantState, dt: number) {
    if (state.firstRepeatAt !== undefined) { return; }

    const t1 = state.t + dt;
    while (state.t < t1) {
        const prevPrev = state.spacetime[state.spacetime.length - 2];
        const prev = state.spacetime[state.spacetime.length - 1];
        const space = new Array(prev.length);

        space[0] = state.table[getFullCombinedState(
            3, prev[80], prev[0], prev[1], prevPrev[0])];

        for (let x = 1; x < 80; x++) {
            space[x] = state.table[getFullCombinedState(
                3, prev[x - 1], prev[x], prev[x + 1], prevPrev[x])];
        }

        space[80] = state.table[getFullCombinedState(
            3, prev[79], prev[80], prev[0], prevPrev[80])];

        if (state.firstRepeatAt === undefined) {
            const wasAbsent = state.sSet.add(space);
            state.sList.push(space);
            if (!wasAbsent) {
                state.firstRepeatAt = state.t;
            }
        }
        state.spacetime.push(space);
        state.t++;
    }
    if (state.spacetime.length > state.timeLen) {
        state.spacetime
            .splice(0, state.spacetime.length - state.timeLen);
    }

    const sListTargetLen = 100_000;
    if (state.sList.length > sListTargetLen) {
        const rem = state.sList.splice(0, state.sList.length - sListTargetLen);
        for (const s of rem) {
            state.sSet.delete(s);
        }
    }
}