

export type SpaceOfSpacetime = {
    spacetime: Uint8Array,
    offset: number,
}

export const space81Hash = (view: SpaceOfSpacetime) => {
    const spacetime = view.spacetime;
    const offset = view.offset;
    let h = 0;
    for (let i = 0; i < 81; i++) {
        h = h ^ (spacetime[offset + i] << ((i % 16) * 2));
    }
    return h;
};

export const space81HashFast = (view: SpaceOfSpacetime) => {
    const spacetime0 = view.spacetime;
    const offset = view.offset;
    let h = 0;
    for (let i = 0; i < 32; i += 2) {
        h = h ^ (spacetime0[offset + i] << i);
    }
    return h;
};

export const space81Equals = (a: SpaceOfSpacetime, b: SpaceOfSpacetime) => {
    const spacetime0 = a.spacetime;
    const offset = a.offset;
    const otherSpacetime = b.spacetime;
    const otherOffset = b.offset;
    for (let i = 0; i < 81; i++) {
        if (spacetime0[offset + i] !== otherSpacetime[otherOffset + i]) {
            return false;
        }
    }
    return true;
};