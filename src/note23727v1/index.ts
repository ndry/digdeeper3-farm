export const parseHashTags = (msg: string) =>
    msg.match(/#[a-z0-9_]+/gi)?.map(t => t.slice(1)) ?? [];

export type Note23727v1 = {
    s: "note237v1",
    tags: string[],
    msg: string,
};

export const noteFromMsg = (msg: string): Note23727v1 => ({
    s: "note237v1",
    tags: parseHashTags(msg),
    msg,
});
