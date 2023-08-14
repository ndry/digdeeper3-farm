import { ruleSpaceSize } from "../../ca237v1/rule-io";
import type * as CryptoJS from "crypto-js";
export type WordArray = CryptoJS.lib.WordArray;



export const ca237v1FromSeed = (seed: WordArray) => {
    let n = seed.words.reduce((n, w) => (n << 32n) + BigInt(w >>> 0), 0n);
    // assert(hash.toString() === n.toString(16).padStart(64, "0"));
    n %= BigInt(ruleSpaceSize);
    return `ca237v1_${n}` as const;
};
