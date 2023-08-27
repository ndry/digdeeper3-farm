import { SHA256 } from "crypto-js";
import { Rule, parseTable } from "../../ca237v1/rule-io";
import { ca237v1FromSeed } from "../nb-2023-08-13-reactor-game/ca237v1-from-seed";
import type * as CryptoJS from "crypto-js";
export type WordArray = CryptoJS.lib.WordArray;
import { HmacSHA256 } from "crypto-js";
import { CustomHashSet } from "../../utils/custom-hash-set";
import { fillPrestartedSpacetime81UsingCyclicBorders } from "./fill-prestarted-spacetime81-using-cyclic-borders";
import { SpaceOfSpacetime, space81Equals, space81HashFast } from "./space-of-spacetime";



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


export function createPlantState(rule: Rule, name: string) {
    return {
        name,
        seed: {
            rule,
            s0: start0,
            s1: start1,
        },
        t: 2,
        sList: [] as number[][],
        table: parseTable(rule),
        spacetime: undefined as Uint8Array | undefined,
        firstRepeatAt: undefined as number | undefined,
    };
}
type PlantState = ReturnType<typeof createPlantState>;

export function updatePlantStateInPlace(state: PlantState, dt: number) {
    if (state.firstRepeatAt !== undefined) { return; }

    const st0len = (dt + 2) * 81;
    const offset = st0len - 81 * 2;
    if (!state.spacetime) {
        const spacetime0 = state.spacetime = new Uint8Array(st0len);
        const ts0 = parseTable(state.seed.s0);
        const ts1 = parseTable(state.seed.s1);
        for (let x = 0; x < 81; x++) {
            spacetime0[offset + x] = ts0[x];
            spacetime0[offset + 81 + x] = ts1[x];
        }
    } else if (state.spacetime.length !== st0len) {
        const newSpacetime0 = new Uint8Array(st0len);
        newSpacetime0.set(state.spacetime, offset);
        state.spacetime = newSpacetime0;
    }
    const spacetime = state.spacetime;
    spacetime.copyWithin(0, offset);

    fillPrestartedSpacetime81UsingCyclicBorders(spacetime, state.table);

    const sSet = new CustomHashSet<SpaceOfSpacetime, number>({
        hashFn: space81HashFast,
        equalsFn: space81Equals,
        // verbose: true,
    });
    for (let t = 0; t < dt; t++) {
        const spaceOffset = (t + 2) * 81;

        if (state.firstRepeatAt === undefined) {
            const wasAbsent = sSet.add({
                spacetime: spacetime, offset: spaceOffset,
            });
            if (!wasAbsent) {
                state.firstRepeatAt = state.t + t;
            }
        } else {
            // if (state.t + t - state.firstRepeatAt > state.timeLen / 2) {
            //     break;
            // }
        }
    }
    state.t += dt;
}