

export type SpaceOfSpacetime = {
    spacetime0: Uint8Array,
    offset: number,
}

export const space81Hash = (view: SpaceOfSpacetime) => {
    const spacetime0 = view.spacetime0;
    const offset = view.offset;
    let h = 0;
    for (let i = 0; i < 81; i++) {
        h = h ^ (spacetime0[offset + i] << ((i % 16) * 2));
    }
    return h;
};

export const space81HashFast = (view: SpaceOfSpacetime) => {
    const spacetime0 = view.spacetime0;
    const offset = view.offset;
    let h = 0;
    for (let i = 0; i < 32; i += 2) {
        h = h ^ (spacetime0[offset + i] << i);
    }
    return h;
};

export const space81Equals = (a: SpaceOfSpacetime, b: SpaceOfSpacetime) => {
    const spacetime0 = a.spacetime0;
    const offset = a.offset;
    const otherSpacetime0 = b.spacetime0;
    const otherOffset = b.offset;
    for (let i = 0; i < 81; i++) {
        if (spacetime0[offset + i] !== otherSpacetime0[otherOffset + i]) {
            return false;
        }
    }
    return true;
};