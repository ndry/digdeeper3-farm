import { pipe } from "fp-ts/lib/function";
import * as D from "io-ts/Decoder";
import { getDigits, getNumberFromDigits } from "../ca/digits";

const i = "ca237@1" as const;
export const implementation = i;
export const stateCount = 3;
export const ruleSpaceSize =
    BigInt(stateCount) ** (BigInt(stateCount) ** BigInt(4));


const r = new RegExp(`^${i}/((0|[1-9][0-9]*)$`);
const asIdGuard = <T>(fn: (x: T) => boolean) => fn as (x: T) => x is typeof x;
export const RuleDecoder = pipe(
    D.string,
    D.refine(
        (rule): rule is `${typeof i}/${string}` => r.test(rule),
        `${i}/\${string representing base 10 number without leading zeros}`),
    D.refine(
        asIdGuard((rule) => BigInt(rule.slice(i.length + 1)) < ruleSpaceSize),
        "rule is within rule space"),
);
/** `ca237@1/${string representing base 10 number without leading zeros}` */
export type Rule = D.TypeOf<typeof RuleDecoder>;

export const parseTable = (rule: Rule) => {
    const table = getDigits(BigInt(rule.slice(i.length + 1)), stateCount);
    while (table.length < stateCount ** 4) { table.push(0); }
    return table;
};

export const keyifyTable =
    (table: number[]) => i + "/" + getNumberFromDigits(table, stateCount);

export { getFullCombinedState } from "./get-full-combined-state";