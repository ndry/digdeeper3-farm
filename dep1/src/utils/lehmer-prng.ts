// https://en.wikipedia.org/wiki/Lehmer_random_number_generator

export class LehmerPrng {
    static MAX_INT32 = 2147483647;
    static MINSTD = 16807;

    seed: number;

    constructor(
        seed: number,
    ) {
        if (!Number.isInteger(seed)) {
            throw new TypeError("Expected `seed` to be a `integer`");
        }

        this.seed = seed % LehmerPrng.MAX_INT32;

        if (this.seed <= 0) {
            this.seed += (LehmerPrng.MAX_INT32 - 1);
        }
    }

    next() {
        return this.seed = this.seed * LehmerPrng.MINSTD % LehmerPrng.MAX_INT32;
    }

    nextFloat() {
        return (this.next() - 1) / (LehmerPrng.MAX_INT32 - 1);
    }
}
