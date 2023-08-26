import { useLayoutEffect, useState } from "react";
import { retroThemeCss } from "../nb-2023-07-06/retro-theme-css";
import { ca237v1FromSeed } from "../nb-2023-08-13-reactor-game/ca237v1-from-seed";
import type * as CryptoJS from "crypto-js";
export type WordArray = CryptoJS.lib.WordArray;
import update from "immutability-helper";
import { atom, useRecoilState } from "recoil";
import { HmacSHA256 } from "crypto-js";
import { createFarmState, createPlantState, mutablePlantStates, updatePlantStateInPlace } from "./model";
import { PotView } from "./pot-view";

const plantCap = 50;
const dt = 15000;


const farmRecoil = atom({
    key: "farm",
    default: createFarmState({
        seed: "farmStateSeed",
        plantCap,
    }),
});



const runByDefault = new URL(location.href).searchParams.get("run") == "1";

export default function Component() {
    const [renderTrigger, setRenderTrigger] = useState(0);
    const [perf, setPerf] = useState(Infinity);
    const [isRunning, setIsRunning] = useState(runByDefault);

    const [farm, setFarm] = useRecoilState(farmRecoil);

    useLayoutEffect(() => {
        if (!isRunning) { return; }

        let h: ReturnType<typeof setTimeout> | undefined;
        const tick = () => {
            const perfStart = performance.now();
            for (const plant of farm.plantKeys) {
                const plantState = mutablePlantStates.get(plant)!;
                updatePlantStateInPlace(plantState, dt);
            }

            // autocollect
            const keysToCollect = farm.plantKeys.filter(plant => {
                const plantState = mutablePlantStates.get(plant)!;
                return plantState.firstRepeatAt !== undefined;
            });
            if (keysToCollect.length > 0) {
                const keysToLeave = farm.plantKeys.filter(plant => {
                    const plantState = mutablePlantStates.get(plant)!;
                    return plantState.firstRepeatAt === undefined;
                });
                let plantIcrement = farm.plantIcrement;
                const moreKeys = Array.from(
                    { length: keysToCollect.length },
                    () => {
                        const seed = HmacSHA256(
                            "seed." + plantIcrement,
                            farm.seed);
                        const rule = ca237v1FromSeed(seed);
                        mutablePlantStates.set(rule,
                            createPlantState(rule, seed.toString()));
                        plantIcrement++;
                        return rule;
                    });

                setFarm(update(farm, {
                    plantIcrement: { $set: plantIcrement },
                    plantKeys: { $set: [...keysToLeave, ...moreKeys] },
                    collectedPlants: { $push: keysToCollect },
                }));
            }

            const perfEnd = performance.now();
            setPerf(perfEnd - perfStart);
            setRenderTrigger(x => x + 1);
            h = setTimeout(tick, 100);
        };
        tick();
        return () => { clearTimeout(h); };
    }, [farm, isRunning]);

    return (
        <div css={[{
            fontSize: "0.71em",
            // display: "flex",
            // flexDirection: "column",
            padding: "1em",
        }, retroThemeCss]}>
            Hello World from {import.meta.url}
            <br />
            <button onClick={() => setIsRunning(x => !x)}>
                {isRunning ? "pause" : "run"}
            </button>
            <br />
            renderTrigger: {renderTrigger} / perf: {perf.toFixed(2)}ms
            <br />
            <button
                onClick={() => {
                    const seed = HmacSHA256(
                        "seed." + farm.plantIcrement,
                        farm.seed);
                    const rule = ca237v1FromSeed(seed);
                    const plant = createPlantState(rule, seed.toString());
                    mutablePlantStates.set(rule, plant);
                    setFarm(update(farm, {
                        plantIcrement: { $set: farm.plantIcrement + 1 },
                        plantKeys: { $push: [rule] },
                    }));
                }}
                disabled={farm.plantKeys.length >= farm.plantCap}
            >plant</button>
            <br />
            <br />
            {farm.plantKeys.map((plantKey, i) => <div key={plantKey}>
                <button onClick={() => {
                    const seed = HmacSHA256(
                        "seed." + farm.plantIcrement,
                        farm.seed);
                    const rule = ca237v1FromSeed(seed);
                    mutablePlantStates.set(
                        rule, createPlantState(rule, seed.toString()));
                    // mutablePlantStates.delete(plant.seed.rule);
                    setFarm(update(farm, {
                        plantIcrement: { $set: farm.plantIcrement + 1 },
                        plantKeys: { $splice: [[i, 1, rule]] },
                        collectedPlants: { $push: [plantKey] },
                    }));
                }}>collect</button>
                &nbsp;
                <button onClick={() => {
                    const seed = HmacSHA256(
                        "seed." + farm.plantIcrement,
                        farm.seed);
                    const rule = ca237v1FromSeed(seed);
                    mutablePlantStates.set(
                        rule, createPlantState(rule, seed.toString()));
                    setFarm(update(farm, {
                        plantIcrement: { $set: farm.plantIcrement + 1 },
                        plantKeys: { $splice: [[i, 1, rule]] },
                    }));
                }}>trash</button>
                <PotView plantKey={plantKey} renderTrigger={renderTrigger} />
            </div>)}
            <br />
            <br />
            collectedPlants:
            {farm.collectedPlants
                .toSorted((a, b) =>
                    (mutablePlantStates.get(b)?.firstRepeatAt ?? -Infinity)
                    - (mutablePlantStates.get(a)?.firstRepeatAt ?? -Infinity))
                .map(plantKey => <div key={plantKey}>
                    <PotView
                        plantKey={plantKey}
                        renderTrigger={renderTrigger}
                    />
                </div>)}
        </div >
    );
}