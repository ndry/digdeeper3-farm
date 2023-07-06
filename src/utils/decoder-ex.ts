import { pipe } from "fp-ts/lib/function";
import * as E from "fp-ts/Either";
import * as D from "io-ts/Decoder";
export * from "io-ts/Decoder";


export const keyRefinedRecord = <Key extends string, A>(
    domain: D.Decoder<unknown, Key>,
    codomain: D.Decoder<unknown, A>,
): D.Decoder<unknown, Partial<Record<Key, A>>> => pipe(
    D.UnknownRecord,
    D.parse((x) => E.right(
        Object.keys(x)
            .filter((k): k is Key => E.isRight(domain.decode(k)))
            .sort()
            .reduce(
                (acc, k) => (acc[k] = x[k], acc),
                {} as Partial<Record<Key, unknown>>))),
    D.compose(D.fromRecord(codomain)),
);

export const refinedSet = <Key extends string>(
    domain: D.Decoder<unknown, Key>,
) => keyRefinedRecord(domain, D.literal(true));

export const integer: D.Decoder<unknown, number> = pipe(
    D.number,
    D.refine((x): x is number => x % 1 === 0, "integer"),
);


