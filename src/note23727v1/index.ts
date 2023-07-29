export const parseHashTags = (s: string) =>
    s.match(/#[a-z0-9_]+/gi)?.map(t => t.slice(1)) ?? [];

export type Note23727v1 = {
    s: "note237v1",
    tags: string[],
    text: string,
};

export const noteFromText = (text: string): Note23727v1 => ({
    s: "note237v1",
    tags: parseHashTags(text),
    text,
});

export const isNote23727v1 = 
    (x: unknown): x is Note23727v1 =>
        (typeof x === "object") && !!x && ("s" in x) && x.s === "note237v1";