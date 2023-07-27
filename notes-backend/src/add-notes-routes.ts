import { RouterType, json } from "itty-router";
import { Env } from "./env";
import { noteFromText } from "core/note23727v1";


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
        const note =
            req.headers.get("content-type")?.includes("application/json")
                ? await req.json()
                : noteFromText(await req.text());

        const key = new Date().toISOString() + Math.random();

        await env.NOTES_KV.put(key, JSON.stringify(note));
        return json({ ok: true, key, note });
    });
