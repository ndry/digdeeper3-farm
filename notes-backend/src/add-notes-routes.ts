import { RouterType, json } from "itty-router";
import { Env } from "./env";


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
        await env.NOTES_KV.put(
            new Date().toISOString() + Math.random(),
            await req.text());
        return json({ ok: true });
    });
