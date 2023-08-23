
export const countCellMatches = (
    table1: ReadonlyArray<number>,
    table2: ReadonlyArray<number>,
) => {
    let counter = 0;
    for (let i = 0; i < table1.length; i++) {
        if (table1[i] === table2[i]) { counter++; }
    }
    return counter;
};
