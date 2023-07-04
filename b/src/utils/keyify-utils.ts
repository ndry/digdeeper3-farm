import * as E from "fp-ts/Either";
import * as D from "io-ts/Decoder";
import { Stringify } from "./stringify";


export const guard = <I, A extends I>(d: D.Decoder<I, A>) =>
    (x: I): x is A =>
        E.isRight(d.decode(x));

export const decode = <I, A extends I>(d: D.Decoder<I, A>) =>
    (x: I) =>
        E.getOrElseW(e => { throw new Error(JSON.stringify(e)); })(d.decode(x));

export const guardKey = <I, A extends I, Key extends string = Stringify<A>>(
    d: D.Decoder<I, A>,
) => {
    const gd = guard(d);
    return (key: unknown): key is Key => {
        if ("string" !== typeof key) { return false; }
        let parsed: A | undefined = undefined;
        try { parsed = JSON.parse(key); } catch { /* mute */ }
        if (undefined === parsed) { return false; }
        return gd(parsed);
    };
};

export const eqByKey = <
    T extends object,
    Key extends string,
>(keyify: (x: T) => Key) => {
    return (a: T | Key, b: T | Key) => {
        if (a === b) { return true; }
        const ka = "string" === typeof a ? a : keyify(a);
        const kb = "string" === typeof b ? b : keyify(b);
        return ka === kb;
    };
};
