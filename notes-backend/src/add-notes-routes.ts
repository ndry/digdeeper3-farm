import { RouterType, json } from "itty-router";
import { Env } from "./env";

const parseHashTags = (msg: string) =>
    msg.match(/#[a-z0-9_]+/gi)?.map(t => t.slice(1)) ?? [];

export const noteFromMsg = (msg: string) => ({ tags: parseHashTags(msg), msg });


export const addNotesRoutes = (router: RouterType) => router
    .get("/notes/", async (req, env: Env) => {
        const keys = await env.NOTES_KV.list();
        const values = await Promise.all(keys.keys.map(async key => {
            const value = await env.NOTES_KV.get(key.name);
            return { key: key.name, value };
        }));
        return json(values);
    })
    .post("/notes/", async (req, env: Env) => {
        const isJson = req.headers.get("content-type")?.includes("application/json");
        const note =
            isJson
                ? await (async () => {
                    const j = await req.json();
                    if (typeof j === "string") { return noteFromMsg(j); }
                    if (typeof j === "object") { return j; }
                    throw new Error(`invalid payload: ${j}`);
                })()
                : noteFromMsg(await req.text());

        const key = new Date().toISOString() + Math.random();

        await env.NOTES_KV.put(key, JSON.stringify(note));
        return json({ ok: true, key, note });
    });
