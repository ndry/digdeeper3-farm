import { s0 } from "../s0";
import { rrr } from "../run-reactor";


export function createSingleOneAt60Substance(
    log: Parameters<typeof rrr>[0],
) {
    const t0 = rrr(log, s0, s0, s0, 6);
    const t1 = rrr(log, t0, s0, s0, 22);
    const t2 = rrr(log, t1, s0, s0, 22);
    const t3 = rrr(log, t2, s0, t1, 5);
    const t4 = rrr(log, s0, t1, t3, 1);

    return t4;
}
