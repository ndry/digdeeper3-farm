

export const getDigits = (n: bigint, base: number) =>
    [...n.toString(base)].map(Number).reverse();

export const getNumberFromDigits = (
    digits: ArrayLike<number>,
    base: number,
) => {
    const basen = BigInt(base);
    let n = 0n;
    for (let i = digits.length - 1; i >= 0; i--) {
        const d = BigInt(digits[i]);
        n *= basen;
        n += d;
    }
    return n;
};