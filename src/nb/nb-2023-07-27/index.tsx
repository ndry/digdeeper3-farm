import { retroThemeCss } from "../nb-2023-07-06/retro-theme-css";
import usePromise from "react-use-promise";
import jsonBeautify from "json-beautify";
import { isRule } from "../../ca237v1/rule-io";
import { RulePreview } from "../../app/rule-preview";


const notesUrl = "https://hq.x-pl.art/notes/";


export default function App() {
    const [notes, notesError, notesStatus] = usePromise(async () => {
        const response = await fetch(notesUrl);
        const notes = await response.json() as Array<
            { key: string, value: unknown }>;
        notes.reverse();
        return notes;
    }, []);


    return <div css={
        [{
            fontSize: "0.7em",
            display: "flex",
            flexDirection: "column",
            padding: "1em",
        }, retroThemeCss]
    }>
        Hello World
        <div>{notesStatus}</div>
        <div>{notesError?.stack}</div>
        {notes?.map((note, i) => {
            const rule =
                !!note.value
                && (typeof note.value === "object")
                && ("tags" in note.value)
                && Array.isArray(note.value.tags)
                && note.value.tags.find(isRule);

            return <div key={i}>
                {rule && <div><RulePreview code={rule} /></div>}
                <pre>{jsonBeautify(note, null as any, 2, 80)}</pre>
            </div>;
        })}
    </div>;
}