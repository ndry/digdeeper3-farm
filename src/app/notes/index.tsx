import { RulePreview } from "../rule-preview";
import { retroThemeCss } from "../../nb/nb-2023-07-06/retro-theme-css";
import usePromise from "react-use-promise";
import { isRule } from "../../ca237v1/rule-io";
import { isNote23727v1 } from "../../note23727v1";
import jsonBeautify from "json-beautify";
import { App, Credentials } from "realm-web";
import { useState } from "react";
import { jsx } from "@emotion/react";


const NoteView = ({
    note,
    isPreview,
    css: cssProp,
    ...props
}: jsx.JSX.IntrinsicElements["div"] & {
    note: unknown,
    isPreview?: boolean,
}) => {
    if (!isNote23727v1(note)) {
        return <div><pre>{jsonBeautify(note, null as any, 2, 80)}</pre></div>;
    }
    const [isShown, setIsShown] = useState(false);

    const rule = note.tags.find(isRule);
    const jsonValue = jsonBeautify(note, null as any, 2, 80);
    const copyJSON = () => {
        const selBox = document.createElement("textarea");
        selBox.style.position = "fixed";
        selBox.style.left = "0";
        selBox.style.top = "0";
        selBox.style.opacity = "0";
        selBox.value = jsonValue;
        document.body.appendChild(selBox);
        selBox.focus();
        selBox.select();
        document.execCommand("copy");
        document.body.removeChild(selBox);
    };
    return <div css={[{ width: "475px" }, cssProp]} {...props}>
        {isPreview
            && rule
            && <RulePreview code={rule} />
        }
        <div>
            <span css={{ display: "inline-block" }}>text:  {note.text} </span>
        </div>
        <div>{note.tags && <span>tags: &thinsp; </span>}
            {
                Array.isArray(note.tags) &&
                note.tags.map((tag, i) => {
                    const filterObj = { tags: tag };
                    const filter = JSON.stringify(filterObj);
                    const searchParams = new URLSearchParams();
                    searchParams.set("filter", filter);
                    const href = `?${searchParams.toString()}`;
                    return <a
                        css={{ display: "inline-block", paddingRight: "1em" }}
                        key={i}
                        href={href}
                    >{tag}</a>;
                })
            }
        </div>
        <button
            title={jsonValue}
            onClick={
                () => {
                    setIsShown(!isShown);
                    console.log(jsonValue);
                    copyJSON();
                }}
        >
            note json &thinsp;
            <span css={{
                display: "inline-block",
                transform: isShown ? "rotate(90deg)" : "rotate(0deg)",
                transition: "transform 0.2s",
            }}> &gt;
            </span>
        </button>

        {isShown
            && <div>
                <pre css={{ marginTop: "0" }}  >{jsonValue} </pre>
            </div>
        }

    </div >;
};

export default function Component() {
    const filterSearchParam = new URL(location.href).searchParams.get("filter");
    const [notes, notesError, notesStatus] = usePromise(async () => {
        const app = App.getApp("xplart-hq-flsoc");
        const user = app.currentUser
            ?? await app.logIn(Credentials.anonymous());
        const notesCollection = user.mongoClient("mongodb-atlas")
            .db("hq")
            .collection<{ _id: unknown } & unknown>("notes");
        const filter = filterSearchParam
            ? JSON.parse(filterSearchParam)
            : undefined;
        const notes = await notesCollection.find(filter, {
            limit: 9999,
            sort: { _id: -1 },
        });
        return notes;
    }, [filterSearchParam]);

    const canvasWidth = window.innerWidth
        ? Math.round(window.innerWidth * 0.40)
        : 200;
    const params = new URL(location.href).searchParams;
    const filter = params.get("filter");
    const filterTags = filter
        ? JSON.parse(filter).tags
        : undefined;
    let rule = undefined;
    let isPreviewRule = false;

    if (Array.isArray(filterTags)) {
        filterTags.map(
            (tag) => {
                isPreviewRule = tag.find(isRule);
                console.log(tag);
                rule = tag;
            });
    } else { isPreviewRule = isRule(filterTags); rule = filterTags; }

    const [page, setPage] = useState(0);
    const notesOnPage = 50;
    const pagination = () => {
        return <div css={{ padding: "1em", margin: "0 auto" }}>
            {notes &&
                Array.from({ length: Math.ceil(notes.length / notesOnPage) },
                    (_, i) =>
                        <button
                            key={i}
                            css={{
                                padding: "0.5em",
                                color: i === page
                                    && "#00ff11 !important"
                                    || "#009714 !important",
                            }}
                            onClick={() => setPage(i)}
                        > {i}</button>)
            }
        </div >;
    };

    return <div css={
        [{
            fontSize: "0.7em",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-evenly",
            padding: "1em",
        }, retroThemeCss]
    }>
        {filterSearchParam && <div><a href="./">global feed</a></div>}
        {notesStatus === "pending" && <div>Loading...</div>}
        {notesError && <div>Error: {notesError.stack}</div>}
        {notesStatus === "resolved"
            && isPreviewRule
            && <RulePreview
                code={rule}
                width={canvasWidth}
                height={canvasWidth * 0.80}
            />}
        {!isPreviewRule && pagination()}
        <div css={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-evenly",
        }}>
            {notesStatus === "resolved"
                && notes
                    .slice(page * notesOnPage, (page + 1) * notesOnPage)
                    .map((note, i) =>
                        <NoteView
                            key={i}
                            note={note}
                            isPreview={!isPreviewRule}
                            css={{
                                margin: "1em",
                            }}
                        />)}
        </div>
        {!isPreviewRule && pagination()}
    </div >;
}
