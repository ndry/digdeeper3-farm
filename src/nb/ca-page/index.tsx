import { ChangeEvent, useEffect, useState } from "react";
import { RulePreview } from "../../app/rule-preview";
import { retroThemeCss } from "../nb-2023-07-06/retro-theme-css";
import { Comment } from "@emotion-icons/boxicons-solid/Comment";
import { CommentAdd } from "@emotion-icons/boxicons-regular/CommentAdd";


export default function App() {

    if (!location.hash) {
        return <div css={
            [{
                fontSize: "0.7em",
                display: "flex",
                flexDirection: "column",
                padding: "1em",
                textAlign: "center",
            }, retroThemeCss]
        }><h1> 404 </h1> </div>;
    }

    const [coments, setComents] = useState<string[][] | undefined>();
    const [inputValue, setInputValue] = useState("");

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        setInputValue(event.target.value);
    };

    const tags = [location.hash, "#like",
        "#dislike", "#clear_periodic_structures"];

    async function listComments(code: string) {
        const response = await fetch(` https://cell.x-pl.art/automata/${code}/comments/`);
        const data: object = await response.json();
        setComents(Object.entries(data));
    }

    const code = location.hash.replace(/#/g, "");

    const sendComment = () => { console.log(inputValue); };

    useEffect(() => { listComments(code); }, []);

    return <div css={
        [{
            fontSize: "0.7em",
            display: "flex",
            flexDirection: "column",
            padding: "1em",
        }, retroThemeCss]
    }>
        <h1 css={{ textAlign: "center" }}> {`CA page - ${code}`} </h1>

        {location.hash &&
            <RulePreview
                css={{ width: "100%" }}
                code={{
                    v: "digdeeper3/ca@2",
                    stateCount: 3,
                    rule: location.hash.replace(/#/g, ""),
                }} />}

        <div> {tags.map(
            (v, i) => {
                return <span
                    key={i}
                    css={{ cursor: "pointer", marginRight: "3px" }}
                    onClick={() => {
                        console.log(v);
                    }}
                >
                    {v} </span>;
            },
        )}

        </div>
        <div>
            <input type="text" placeholder="add your comment"
                value={inputValue} onChange={handleChange}
                css={{
                    marginRight: "3px",
                    background: "#00bf0d",
                }}
            />
            <button onClick={() => sendComment()} ><CommentAdd height={"14px"}
            /></button>
        </div>
        <div css={{ width: "100%" }}>
            <p> <Comment height={"14px"} css={{ marginRight: "3px" }} />
                coments:  {!coments && 0} {coments?.length}</p>
            {coments && coments.map(
                (v, i) => {
                    return <div css={{ width: "100%" }}
                        key={i}> {v[1]} </div>;
                }
            )}
        </div>
    </div>;
}