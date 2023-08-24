import { countCellMatches } from "../nb-2023-08-19-reactor-game-biomass/countCellMatches";

export const getEnergyDelta = (table: number[], targetTable: number[]) => {
    const c1 = countCellMatches(table, targetTable);
    const t1 = [...targetTable];
    t1.push(t1.shift()!);
    const c2 = countCellMatches(table, t1);
    const t2 = [...targetTable];
    t2.unshift(t2.pop()!);
    const c3 = countCellMatches(table, t2);
    const cMax = Math.max(c1, c2, c3);
    const cMin = Math.min(c1, c2, c3);

    // c=27 is kind of the max chaotic change (every cell changed randomly)
    // c=0 is max ordered change (no cells changed)
    // c=81 is max ordered change (every cell changed)

    if (cMin <= 9) { return -1; }
    if (cMax >= 27 - 9 && cMin <= 27 + 9 * 2) { return -1; }
    if (cMax >= 81 - 9 * 2) { return -1; }
    return 1;
};
