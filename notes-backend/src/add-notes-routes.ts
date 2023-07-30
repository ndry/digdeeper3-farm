import { RouterType, json } from "itty-router";
import { Env } from "./env";
import { noteFromText } from "core/note23727v1";
import { App, Credentials } from "realm-web";
import { _never } from "core/utils/_never";

async function getNotesCollection(env: Env) {
    const user = await App.getApp("xplart-hq-flsoc").logIn(Credentials.apiKey(env.REALM_APPTOKEN));
    return user.mongoClient("mongodb-atlas").db("hq").collection("notes");
}

export const addNotesRoutes = (router: RouterType) => router
    .post("/notes/", async (req, env: Env) => {
        const note =
            req.headers.get("content-type")?.includes("application/json")
                ? await req.json()
                : noteFromText(await req.text());

        const result = await (await getNotesCollection(env)).insertOne(note as any);

        return json({ ok: true, note, result });
    });
