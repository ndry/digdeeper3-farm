import { SHA256 } from "crypto-js";
import { Rule, parseTable } from "../../../ca237v1/rule-io";
import { ca237v1FromSeed } from "../../nb-2023-08-13-reactor-game/ca237v1-from-seed";
import type * as CryptoJS from "crypto-js";
export type WordArray = CryptoJS.lib.WordArray;
import { HmacSHA256 } from "crypto-js";
import { fillPrestartedSpacetime81UsingCyclicBorders } from "./fill-prestarted-spacetime81-using-cyclic-borders";
import { findRepeat } from "./find-repeat";
import { prepareSpacetime81 } from "./prepare-spacetime81";



const start0 = ca237v1FromSeed(SHA256("start0"));
const start1 = ca237v1FromSeed(SHA256("start1"));

export const mutablePlantStates = new Map<string, PlantState>();

export function createFarmState({
    seed,
    plantCap,
}: {
    seed: string,
    plantCap: number,
}) {
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


export const createPlantState = (rule: Rule, name: string) => ({
    name,
    seed: {
        rule,
        s0: start0,
        s1: start1,
    },
    t: 2,
    table: parseTable(rule),
    spacetime: new Uint8Array([
        ...parseTable(start0),
        ...parseTable(start1),
    ]),
    firstRepeatAt: undefined as number | undefined,
});
type PlantState = ReturnType<typeof createPlantState>;

export function updatePlantStateInPlace(state: PlantState, dt: number) {
    if (state.firstRepeatAt !== undefined) { return; }

    state.spacetime = prepareSpacetime81(state.spacetime, dt);
    fillPrestartedSpacetime81UsingCyclicBorders(state.spacetime, state.table);
    const repeatAt = findRepeat(state.spacetime, 0, dt);
    if (repeatAt !== -1) { state.firstRepeatAt = state.t + repeatAt; }

    state.t += dt;
}