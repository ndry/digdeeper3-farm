import { useState } from "react";
import { RulePreview } from "../../app/rule-preview";
import { retroThemeCss } from "../nb-2023-07-06/retro-theme-css";
import usePromise from "react-use-promise";
import { isRule } from "../../ca237v1/rule-io";

const notesUrl = "https://hq.x-pl.art/notes/";

const url = new URL(notesUrl);


type NoteValue = {
    s: string,
    tags: Array<string>,
    text: string,
}

const Note = ({ note }: { note: { key: string, value: NoteValue } }) => {
    const isPreview = Array.isArray(note.value.tags)
        && note.value.tags.find((tag) => isRule(tag));
    console.log(url.toString());
    console.log(isPreview);
    return <div css={{}}>
        <span>s: {note.value.s}  </span>
        {
            Array.isArray(note.value.tags) &&
            note.value.tags.map((tag, i) =>
                <p
                    css={{ cursor: "pointer" }}
                    key={i}
                    onClick={
                        () => {
                            url.searchParams.delete('tag');
                            url.searchParams.append("tag", tag);
                            window.location.href = url.href;
                            console.log(url.href);
                        }
                    }
                >
                    {tag}
                </p>)
        }
        {
            isPreview
            && <RulePreview code={{
                v: "digdeeper3/ca@2",
                stateCount: 3,
                rule: isPreview.replace(/^.*?_/g, ""),
            }}
            />
        }
        <span>m:  {note.value.text} </span>
    </div >;
};

export default function App() {
    const [notes, setNotes] =
        useState<Array<{ key: string, value: NoteValue }>>([]);

    const [fetchedNotes, notesError, notesStatus] = usePromise(async () => {
        const response = await fetch(url.href);
        const notes = await response.json() as Array<
            { key: string, value: NoteValue }>;
        notes.reverse();
        setNotes(notes);
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
        {notesStatus === "pending" && <div> Loading... </div>}
        {notesStatus === "resolved"
            && notes.map((note) => <Note note={note} key={note.key} />)}
    </div >;
}
