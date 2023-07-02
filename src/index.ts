import { generateRandomRule } from "./ca/generate-random-rule";
import { LehmerPrng } from "./utils/lehmer-prng";
import { createRun } from "./run";
import { version as caVersion } from "./ca";
import { train } from "./nnpilot";
import * as  tf from "@tensorflow/tfjs-node";
import util from "util";

util.inspect.defaultOptions.depth = 10;


const code = {
    v: caVersion,
    stateCount: 3,
    rule: "125432894114651584386512079219058453323",
}
const spaceSize = 161;


const programPathabeDate = new Date().toISOString().replace(/:/g, "-");
(async () => {
    const zones = Array.from({ length: 4 }, (_, i) => 4242 + i);

    let nextAgents = [
        undefined,
    ] as (undefined | tf.Sequential)[];
    for (let i = 0; i < 999; i++) {
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

                    for (let i = 0; i <= 1000; i++) {
                        if (!run.tick()) { break; }
                        if (i % 100 === 0) {
                            await run.render();
                        }
                    }

                    // console.log({ runId, zone, stats: run.stats() });
                    return run;
                })));
        const bestRuns = [...completedRuns]
            .sort((a, b) => b.stats().maxDepth - a.stats().maxDepth)
            .slice(0, 20);
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
        ];
    }
})();
