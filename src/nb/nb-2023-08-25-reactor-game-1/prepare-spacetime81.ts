
export const prepareSpacetime81 = (
    prevSpacetime: Uint8Array,
    requestedDt: number
) => {
    const st0len = (requestedDt + 2) * 81;
    const offset = st0len - 81 * 2;
    if (prevSpacetime.length !== st0len) {
        const newSpacetime = new Uint8Array(st0len);
        newSpacetime.set(prevSpacetime, offset);
        prevSpacetime = newSpacetime;
    }
    prevSpacetime.copyWithin(0, offset);
    return prevSpacetime;
};
