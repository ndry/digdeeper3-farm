
export const evolveThreeSpace81PbcInPlace = (
    table: number[] | Uint8Array,
    prevPrevSpace: Uint8Array,
    prevSpace: Uint8Array,
    space: Uint8Array,
    dt: number,
) => {
    // optimized for performance

    for (let t = 0; t < dt; t++) {
        let n1 = prevSpace[80];
        let c = prevSpace[0];
        let n2 = prevSpace[1];
        space[0] = table[n1 + c * 3 + n2 * 9 + prevPrevSpace[0] * 27];

        for (let x = 0; x < 80; x++) {
            n1 = c;
            c = n2;
            n2 = prevSpace[x + 1];
            space[x] = table[n1 + c * 3 + n2 * 9 + prevPrevSpace[x] * 27];
        }

        n1 = c;
        c = n2;
        n2 = prevSpace[0];
        space[80] = table[n1 + c * 3 + n2 * 9 + prevPrevSpace[80] * 27];

        [prevPrevSpace, prevSpace, space] = [prevSpace, space, prevPrevSpace];
    }
};
