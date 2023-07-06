export const sortedBy = <T>(arr: T[], keyFn: (x: T) => string) =>
    arr
        .map(x => [keyFn(x), x] as const)
        .sort(([keyA], [keyB]) => keyA.localeCompare(keyB, "en"))
        .map(([, x]) => x);
