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
    if (cMax >= 63) { return -1; }
    const cMin = Math.min(c1, c2, c3);
    if (cMin <= 36) { return -1; }
    return 1;
};
