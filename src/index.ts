import Jimp from "jimp";
import { promises as fs } from "fs";
import path from "path";
import { createSpacetimeEvaluator } from "./ca/create-spacetime-evaluator";
import { generateRandomRule } from "./ca/generate-random-rule";
import { LehmerPrng } from "./utils/lehmer-prng";
import { tuple } from "./utils/tuple";


const colors = [
    0xffffffff,
    0x000000ff,
    0x0000ffff,
];
const playerColor = 0xff0000ff;

const code = generateRandomRule(3, (() => {
    const seed = 42421;
    const prng = new LehmerPrng(seed);
    return () => prng.nextFloat();
})());
const spaceSize = 61;
const timeSize = 300;
const ca = createSpacetimeEvaluator({
    code,
    seed: 4242,
    spaceSize,
    startFillState: 0,
});

const forward = 0;
const left = 1;
const right = 2;
const backward = 3;

export const directionVec = {
    [forward]: [0, 1],
    [left]: [-1, 0],
    [right]: [1, 0],
    [backward]: [0, -1],
};

const playerPosition = tuple(Math.floor(spaceSize / 2), 0);

const rnd = new LehmerPrng(42424242);


(async () => {


    for (let i = 0; i < 50; i++) {
        const possibleDirections = [forward, left, right, backward]
            .filter(d => {
                const [dx, dt] = directionVec[d];
                const [x, t] = playerPosition;
                const [nx, nt] = tuple(x + dx, t + dt);
                if (nt < 0) { return false; }
                if (nx < 0 || nx >= spaceSize) { { return false; } }
                return true;
                // return ca._at(nt, nx) !== 2;
            });

        if (possibleDirections.length === 0) {
            console.log("No possible directions");
            break;
        }

        const direction = possibleDirections[rnd.next() % possibleDirections.length];
        playerPosition[0] += directionVec[direction][0];
        playerPosition[1] += directionVec[direction][1];

        await writeImage(i);
    }

})();

function writeImage(i: number) {
    return new Promise<void>(async (resolve, reject) => {
        const image = new Jimp(timeSize, spaceSize, async function (err, image) {
            if (err) throw err;

            for (let t = 0; t < timeSize; t++) {
                for (let x = 0; x < spaceSize; x++) {
                    image.setPixelColor(colors[ca._at(t, x)], t, x);
                }
            }

            image.setPixelColor(
                playerColor,
                playerPosition[1], playerPosition[0]);

            const p = path.join("output", `rule_${code.rule}/${i}.png`);
            await fs.mkdir(path.dirname(p), { recursive: true });
            // const pathableDate = new Date().toISOString().replace(/:/g, "-");
            await image.writeAsync(p);
            console.log(`Wrote ${p}`);
            resolve();
        });
    });
}