import { generateRandomRule } from "./ca/generate-random-rule";
import { LehmerPrng } from "./utils/lehmer-prng";
import { createRun } from "./run";
import { version as caVersion } from "./ca";
import { train } from "./nnpilot";
import * as  tf from "@tensorflow/tfjs-node";
import util from "util";
import { promises as fs } from "fs";
import path from "path";

util.inspect.defaultOptions.depth = 10;


const code = {
    v: caVersion,
    stateCount: 3,
    rule: "299995569439125313185844037724571538281",
}
const spaceSize = 161;


const programPathabeDate = new Date().toISOString().replace(/:/g, "-");
(async () => {
    const zonesRandom = new LehmerPrng(4242);

    let nextAgents = [
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
    ] as (undefined | tf.Sequential)[];
    for (let i = 0; i < 999; i++) {
        const zones = Array.from({ length: 1 }, (_, k) => 4242);
        const pathableDate = new Date().toISOString().replace(/:/g, "-");
        const completedRuns = await Promise.all(
            zones.flatMap((zone) =>
                nextAgents.map(async (model, j) => {
                    const runId = pathableDate + "-" + j
                    const run = createRun({
                        runId,
                        programPathabeDate,
                        code,
                        spaceSize,
                        startFillState: 0,
                        spacetimeSeed: zone,
                        tickSeed: 4243 + i * 13 + j * 17 + i * j * 19,
                        copilotModel: model,
                    });
                    await run.render();

                    for (let i = 0; i <= 10000; i++) {
                        if (!run.tick()) { break; }
                        if (i % 500 === 0) {
                            // await run.render();
                        }
                        if (run.stats().maxDepth < i / 50 - 10) {
                            await run.render();
                            console.log({ gameOver: "Enough is enough" });
                            break;
                        }
                    }

                    // console.log({ runId, zone, stats: run.stats() });
                    await fs.appendFile(
                        path.join("output", "runs.csv"),
                        [runId, run.stats().maxDepth].join(",") + "\n",
                    );
                    await run.render();
                    return run;
                })));
        const bestRuns = [...completedRuns]
            .sort((a, b) => b.stats().maxDepth - a.stats().maxDepth)
            .slice(0, 4);
        const maxestDepth = bestRuns[0].stats().maxDepth;
        console.log({
            maxDepths: bestRuns.map((run) => run.stats().maxDepth),
            maxestDepth,
        });
        const bestModels = await Promise.all(
            bestRuns.map(async run => {
                const stats = run.stats();
                return await train(stats.copilotModel, stats.data);
            }));
        nextAgents = [
            ...bestModels,
            undefined,
            undefined,
        ];
    }
})();
