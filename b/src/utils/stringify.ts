import { Union } from "ts-toolbelt";

/**
 * The following implementation is neither complete nor general.
 * Lots of corner cases are missing.
 * The key order of object keys is not guaranteed.
 * 
 * Here, this implementation solves 
 *   draft duck typing of keys based on JSON.stringify
 */


type Error<T extends string> = { error: true } & T;

type ObjMember<T, K extends string & keyof T> =
    string extends K 
        ? `${string}`
        : `"${K}":${Stringify<T[K]>}`;
type ObjBody<
    T extends object, 
    Keys extends ReadonlyArray<keyof T>
> = Keys extends [infer Key, ...infer RestKeys] 
        ? Key extends string & keyof T
            ? [] extends RestKeys
                ? `${ObjMember<T, Key>}` // last key
                : RestKeys extends (keyof T)[]
                    ? `${ObjMember<T, Key>},${ObjBody<T, RestKeys>}` 
                    : Error<"StringifyObjectBody: Unknown 0">
            : Error<"StringifyObjectBody: Key is not string">
        : ""; // empty object
type StringifyObject<T extends object> = 
    `{${ObjBody<T, Union.ListOf<keyof T>>}}`;

type StringifyArray<T> =
    T extends [infer El1, infer El2, infer El3, infer El4]
        ? `[${S<El1>},${S<El2>},${S<El3>},${S<El4>}]`
        : T extends [infer El1, infer El2, infer El3]
            ? `[${S<El1>},${S<El2>},${S<El3>}]`
            : T extends [infer El1, infer El2]
                ? `[${S<El1>},${S<El2>}]`
                : T extends [infer El1]
                    ? `[${S<El1>}]`
                    : T extends (infer El)[] 
                        ? "[]" | `[${S<El>}]` | `[${S<El>},${string}${S<El>}]`
                        : Error<"StringifyArray: Not an array">;

export type Stringify<T> =
    T extends string
        ? `"${T}"`
        : T extends number | boolean | null
            ? `${T}`
            : T extends unknown[]
                ? `${StringifyArray<T>}`
                : T extends object
                    ? StringifyObject<T>
                    : Error<"Stringify: Type not supported">;

type S<T> = Stringify<T>;


type ShObjMember<T, K extends string & keyof T> =
    string extends K ? `${string}` : `"${K}":${string}`;
type ShObjBody<
    T extends object, 
    Keys extends ReadonlyArray<keyof T>
> = Keys extends [infer Key, ...infer RestKeys] 
        ? Key extends string & keyof T
            ? [] extends RestKeys
                ? `${ShObjMember<T, Key>}` // last key
                : RestKeys extends (keyof T)[]
                    ? `${ShObjMember<T, Key>},${ShObjBody<T, RestKeys>}` 
                    : Error<"StringifyObjectBody: Unknown 0">
            : Error<"StringifyObjectBody: Key is not string">
        : ""; // empty object
type ShallowStringifyObject<T extends object> = 
    `{${ShObjBody<T, Union.ListOf<keyof T>>}}`;

type ShallowStringifyArray<T> =
    T extends [unknown, unknown, unknown, unknown]
        ? `[${string},${string},${string},${string}]`
        : T extends [unknown, unknown, unknown]
            ? `[${string},${string},${string}]`
            : T extends [unknown, unknown]
                ? `[${string},${string}]`
                : T extends [unknown]
                    ? `[${string}]`
                    : T extends unknown[] 
                        ? `[${string}]`
                        : Error<"StringifyArray: Not an array">;

export type ShallowStringify<T> =
    T extends string
        ? `"${T}"`
        : T extends number | boolean | null
            ? `${T}`
            : T extends unknown[]
                ? `${ShallowStringifyArray<T>}`
                : T extends object
                    ? ShallowStringifyObject<T>
                    : Error<"Stringify: Type not supported">;
