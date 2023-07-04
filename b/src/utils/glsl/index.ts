import { Color, ColorRepresentation } from "three";


export const float = (x: number) => x % 1 ? x.toString() : x.toFixed(1);

export const vec = (
    ...vec: [number, number]
        | [number, number, number]
        | [number, number, number, number]
) => `vec${vec.length}(${vec.map(float).join(", ")})`;

export const color = (color: ColorRepresentation) =>
    vec(...new Color(color).toArray() as [number, number, number]);