
/**
 * Optimized for performance
 */
export function fillPrestartedSpacetime81UsingCyclicBorders(
    spacetime: Uint8Array,
    table: number[] | Uint8Array,
) {
    const len = spacetime.length - 2 * 81;
    for (let ppi = 0; ppi < len; ppi += 81) {
        const pi = ppi + 81;
        const i = pi + 81;

        spacetime[i + 0] = table[spacetime[pi + 80]
            + spacetime[pi + 0] * 3
            + spacetime[pi + 1] * 9
            + spacetime[ppi + 0] * 27];

        for (let x = 1; x < 80; x++) {
            const cs = spacetime[pi + x - 1]
                + spacetime[pi + x] * 3
                + spacetime[pi + x + 1] * 9
                + spacetime[ppi + x] * 27;
            spacetime[i + x] = table[cs];
        }

        spacetime[i + 80] = table[spacetime[pi + 79]
            + spacetime[pi + 80] * 3
            + spacetime[pi + 0] * 9
            + spacetime[ppi + 80] * 27];
    }
}
