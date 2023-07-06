
export const trustedKeys =
    <TRecord extends Partial<Record<keyof object, unknown>>>(obj: TRecord) =>
        Object.keys(obj) as (keyof TRecord)[];

export const trustedValues =
    <TRecord extends Partial<Record<keyof object, unknown>>>(obj: TRecord) =>
        Object.values(obj) as (NonNullable<TRecord[keyof TRecord]>)[];

export const trustedEntries =
    <TRecord extends Partial<Record<keyof object, unknown>>>(obj: TRecord) =>
        Object.entries(obj) as [
            keyof TRecord,
            NonNullable<TRecord[keyof TRecord]>
        ][];

export const trustedFromEntries = 
    <Key extends PropertyKey, T>(entries: Iterable<readonly [Key, T]>) =>
        Object.fromEntries(entries) as Partial<Record<Key, T>>;
    