import SHA256 from "crypto-js/sha256";
import { _never } from "./_never";


export function createCryptoRandom(
    seed: Parameters<typeof SHA256>[0],
    hasher = SHA256,
) {
    let arr = SHA256(seed).words;
    const randUInt32 = () => {
        if (arr.length === 1) {
            const seed = arr.shift()?.toString() ?? _never();
            arr = hasher(seed).words;
        }
        return ((arr.shift() ?? _never()) >>> 0);
    };
    const random = Object.assign(
        /**
         * @returns a random number in [0, 1) like `Math.random()`
         */
        () => randUInt32() / (~0 >>> 0),
        {
            uint32: randUInt32,
            rangeInt: (maxExcl: number) => Math.floor(random() * maxExcl),
            el: <T>(arr: T[]) => arr[random.rangeInt(arr.length)],
        });
    return random;
}
