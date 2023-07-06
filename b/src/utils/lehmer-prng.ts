// https://en.wikipedia.org/wiki/Lehmer_random_number_generator


const MAX_INT32 = 0x7fffffff;
const MINSTD = 16807;
export const lehmer32 = (seed: number) => seed * MINSTD % MAX_INT32;

export const createLehmer32 = (seed: number) => () => seed = lehmer32(seed);
export const createLehmer01 = (seed: number) => {
    const next = createLehmer32(seed);
    return () => (next() - 1) / (MAX_INT32 - 1);
};

/**
 * @deprecated Use `createLehmer32` or `createLehmer01` instead.
 */
export class LehmerPrng {

    seed: number;

    constructor(
        seed: number,
    ) {
        if (!Number.isInteger(seed)) {
            throw new TypeError("Expected `seed` to be a `integer`");
        }

        this.seed = seed % MAX_INT32;

        if (this.seed <= 0) {
            this.seed += (MAX_INT32 - 1);
        }
    }

    next() {
        return this.seed = lehmer32(this.seed);
    }

    nextFloat() {
        return (this.next() - 1) / (MAX_INT32 - 1);
    }
}


