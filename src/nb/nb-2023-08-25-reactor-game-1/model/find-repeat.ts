import { CustomHashSet } from "../../../utils/custom-hash-set";


type OffsetOnSpacetime = {
    spacetime: Uint8Array,
    offset: number,
}

const twoSpace81Hash = (x: OffsetOnSpacetime) => {
    const spacetime = x.spacetime;
    const offset = x.offset;
    let h = 0;
    for (let i = 0; i < 162; i++) {
        h = h ^ (spacetime[offset + i] << ((i % 16) * 2));
    }
    return h;
};

const twoSpace81HashFast = (x: OffsetOnSpacetime) => {
    const spacetime0 = x.spacetime;
    const offset = x.offset;
    let h = 0;
    for (let i = 0; i < 32; i += 2) {
        h = h ^ (spacetime0[offset + i] << i);
    }
    return h;
};

const twoSpace81Equals = (a: OffsetOnSpacetime, b: OffsetOnSpacetime) => {
    const spacetime0 = a.spacetime;
    const offset = a.offset;
    const otherSpacetime = b.spacetime;
    const otherOffset = b.offset;
    for (let i = 0; i < 162; i++) {
        if (spacetime0[offset + i] !== otherSpacetime[otherOffset + i]) {
            return false;
        }
    }
    return true;
};

export const findRepeat = (
    spacetime: Uint8Array,
    startT: number,
    endT: number,
) => {
    const sSet = new CustomHashSet<OffsetOnSpacetime, number>({
        hashFn: twoSpace81HashFast,
        equalsFn: twoSpace81Equals,
        // verbose: true,
    });
    for (let t = startT; t < endT - 1; t++) {
        const wasAbsent = sSet.add({
            spacetime: spacetime, offset: t * 81,
        });
        if (!wasAbsent) {
            return t;
        }
    }
    return -1;
};
