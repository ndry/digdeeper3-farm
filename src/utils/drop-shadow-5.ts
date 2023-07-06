

export const dropShadow5 = (d: string, blur: string, color: string) =>
    `drop-shadow(${d} 0 ${blur} ${color})`
    + ` drop-shadow(-${d} 0 ${blur} ${color})`
    + ` drop-shadow(0 ${d} ${blur} ${color})`
    + ` drop-shadow(0 -${d} ${blur} ${color})`
    + ` drop-shadow(0 0 ${blur} ${color})`;