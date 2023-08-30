import { pipe } from "fp-ts/lib/function";
import * as D from "io-ts/Decoder";
import { getDigits, getNumberFromDigits } from "../ca/digits";
import { stateCount } from "./state-count";
import { guard } from "../utils/keyify-utils";


export const implementation = "ca237v1" as const;
export const ruleSpaceSize =
    BigInt(stateCount) ** (BigInt(stateCount) ** BigInt(4));


const i = implementation;
const r = new RegExp(`^${i}_(0|[1-9][0-9]*)$`);
const asIdGuard = <T>(fn: (x: T) => boolean) => fn as (x: T) => x is typeof x;
export const RuleDecoder = pipe(
    D.string,
    D.refine(
        (rule): rule is `${typeof i}_${bigint}` => r.test(rule),
        `${i}/\${string representing base 10 number without leading zeros}`),
    D.refine(
        asIdGuard((rule) => BigInt(rule.slice(i.length + 1)) < ruleSpaceSize),
        "rule is within rule space"),
);
/** `ca237v1_${string representing base 10 number without leading zeros}` */
export type Rule = D.TypeOf<typeof RuleDecoder>;

export const parseTable = (rule: Rule) => {
    const table = getDigits(BigInt(rule.slice(i.length + 1)), stateCount);
    while (table.length < stateCount ** 4) { table.push(0); }
    return table;
};

export const keyifyTable =
    (table: ReadonlyArray<number> | Uint8Array): Rule =>
        `${i}_${getNumberFromDigits(table, stateCount)}`;

export const isRule = guard(RuleDecoder);