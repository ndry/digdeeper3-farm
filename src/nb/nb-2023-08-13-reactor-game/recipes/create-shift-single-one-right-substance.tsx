import { s0 } from "../s0";
import { rrr } from "../run-reactor";
import { createSingleOneAt60Substance } from "./create-single-one-at-60-substance";




export function createShiftSingleOneRightSubstance(
    log: Parameters<typeof rrr>[0]
) {
    const sSingleOneAt60 = createSingleOneAt60Substance(log);
    const t0 = rrr(log, s0, s0, s0, 138);
    const t1 = rrr(log, t0, s0, sSingleOneAt60, 200);
    const t2 = rrr(log, t1, s0, sSingleOneAt60, 67);
    const t3 = rrr(log, t2, s0, sSingleOneAt60, 145);
    return t3;
}
