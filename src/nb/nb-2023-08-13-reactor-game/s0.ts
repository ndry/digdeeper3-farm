import { SHA256 } from "crypto-js";
import { ca237v1FromSeed } from "./ca237v1-from-seed";

export const s0 = (() => {
    const msg = "12d6 rolled 266-164-634-551"
        // eslint-disable-next-line max-len
        + " at 0x000000000000000000026d15f33764be84855e32d8ea6d73efa4c0a521b1976a / 2023-08-13T20:09:09.439Z"
        + " to reveal the structure of void";
    const seed = SHA256(msg);
    const s0 = ca237v1FromSeed(seed);
    return s0;
})();
