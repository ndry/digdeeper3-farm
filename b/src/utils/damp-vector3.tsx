import { MathUtils, Vector3 } from "three";

const { damp } = MathUtils;
export const dampVector3 = (
    out: Vector3,
    a: Vector3,
    b: Vector3,
    lambda: number,
    dt: number,
) => out.set(
    damp(a.x, b.x, lambda, dt),
    damp(a.y, b.y, lambda, dt),
    damp(a.z, b.z, lambda, dt));
