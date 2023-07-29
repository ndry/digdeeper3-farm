import { RulePreview } from "../rule-preview";
import { retroThemeCss } from "../../nb/nb-2023-07-06/retro-theme-css";
import usePromise from "react-use-promise";
import { isRule } from "../../ca237v1/rule-io";
import { isNote23727v1 } from "../../note23727v1";
import jsonBeautify from "json-beautify";


const NoteView = ({
    note,
}: {
    note: unknown,
}) => {
    if (!isNote23727v1(note)) {
        return <div><pre>{jsonBeautify(note, null as any, 2, 80)}</pre></div>;
    }

    const rule = note.tags.find(isRule);
    return <div css={{}}>
        <span>s: {note.s}  </span>
        {
            Array.isArray(note.tags) &&
            note.tags.map((tag, i) => {
                const filterObj = { tags: tag };
                const filter = JSON.stringify(filterObj);
                const searchParams = new URLSearchParams();
                searchParams.set("filter", filter);
                const href = `?${searchParams.toString()}`;
                return <a
                    css={{ padding: "1em" }}
                    key={i}
                    href={href}
                >{tag}</a>;
            })
        }
        {rule && <RulePreview code={rule} />}
        <span>text:  {note.text} </span>
        <div><pre>{jsonBeautify(note, null as any, 2, 80)}</pre></div>
    </div >;
};

export default function App() {
    const filterSearchParam = new URL(location.href).searchParams.get("filter");
    const [notes, notesError, notesStatus] = usePromise(async () => {
        const response = await fetch(`${import.meta.env.VITE_CORS_PROXY}?https://westeurope.azure.data.mongodb-api.com/app/xplart-hq-flsoc/endpoint/data/v1/action/find`, {
            method: "POST",
            headers: { apiKey: import.meta.env.VITE_NOTES_PUBLIC_READ_KEY },
            body: JSON.stringify({
                dataSource: "mongodb-atlas",
                database: "hq",
                collection: "notes",
                limit: 9999,
                sort: { "_id": -1 },
                filter: JSON.parse(filterSearchParam ?? "\"\""),
            }),
        });
        if (!response.ok) { throw new Error(response.statusText); }
        const result = await response.json();
        const notes = result.documents as unknown[];
        return notes;
    }, [filterSearchParam]);


    return <div css={
        [{
            fontSize: "0.7em",
            display: "flex",
            flexDirection: "column",
            padding: "1em",
        }, retroThemeCss]
    }>
        {notesStatus === "pending" && <div>Loading...</div>}
        {notesError && <div>Error: {notesError.stack}</div>}
        {notesStatus === "resolved"
            && notes.map((note, i) => <NoteView key={i} note={note} />)}
    </div >;
}
