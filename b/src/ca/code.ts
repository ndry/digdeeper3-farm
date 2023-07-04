import { pipe } from "fp-ts/lib/function";
import * as D from "io-ts/Decoder";
import { version } from "./version";
import { decode, eqByKey } from "../utils/keyify-utils";


const asIdGuard = <T>(fn: (x: T) => boolean) => fn as (x: T) => x is typeof x;

const _ruleSpaceSize = [
    0,
    BigInt(1) ** (BigInt(1) ** BigInt(4)),
    BigInt(2) ** (BigInt(2) ** BigInt(4)),
    BigInt(3) ** (BigInt(3) ** BigInt(4)),
    BigInt(4) ** (BigInt(4) ** BigInt(4)),
    BigInt(5) ** (BigInt(5) ** BigInt(4)),
];
const ruleSpaceSize = (stateCount: number) =>
    _ruleSpaceSize[stateCount]
        ?? BigInt(stateCount) ** (BigInt(stateCount) ** BigInt(4));

export const CodeDecoder = pipe(
    D.struct({
        v: D.literal(version),
        stateCount: pipe(
            D.number,
            D.refine(
                (n): n is number =>
                    Number.isInteger(n) && n >= 2 && n <= 10,
                "integer in [2, 10]"),
        ),
        rule: pipe(
            D.string,
            D.refine(
                (s): s is string =>
                    /^(0|[1-9][0-9]*)$/.test(s),
                "BigInt base 10 string without leading zeros"),
        ),
    }),
    D.refine(
        asIdGuard(({ stateCount, rule }) =>
            BigInt(rule) < ruleSpaceSize(stateCount)),
        "rule is within rule space",
    ));

export type Code = D.TypeOf<typeof CodeDecoder>;

export const keyProjectCode = decode(CodeDecoder);
export const keyifyCode = (x: Code) => JSON.stringify(keyProjectCode(x));
export const eqCode = eqByKey(keyifyCode);