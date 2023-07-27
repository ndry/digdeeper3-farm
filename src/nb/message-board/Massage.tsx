import { RulePreview } from "../../app/rule-preview";
import { retroThemeCss } from "../nb-2023-07-06/retro-theme-css";
import { Comment } from "@emotion-icons/boxicons-solid/Comment";
import { CommentAdd } from "@emotion-icons/boxicons-regular/CommentAdd";
import { ChangeEvent, useState } from "react";

export function Massage(
    { massages, 
    }: {
        massages: {
            msg: [],
            tags: [],
            ca: {
                v: "digdeeper3/ca@2",
                stateCount: number,
                rule: string,
            }
        }
    }) {
    const [inputValue, setInputValue] = useState("");

    const sendComment = () => { console.log(inputValue); setInputValue("") };
    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        setInputValue(event.target.value);
    };
    return <div css={
        [{
            fontSize: "0.7em",
            display: "flex",
            flexDirection: "column",
            padding: "1em",
            borderBottom: "solid 1px",
            marginBottom: "5px",
        }, retroThemeCss]
    }>
        <h2> {massages.ca.rule} </h2>

        {massages.ca && <RulePreview
            css={{ width: "100%", }}
            code={massages.ca} />}

        {massages.tags && <div> {massages.tags.map(
            (v, i) => {
                return <span
                    key={i}
                    css={{
                        cursor: "pointer",
                        marginRight: "3px",
                        fontSize: "12px",
                    }}
                    onClick={() => {
                        console.log(v);
                    }} >
                    {v} </span>;
            },
        )}

        </div>}

        <div>
            <p css={{ fontSize: "12px" }}>
                <Comment height={"12px"} css={{ marginRight: "3px" }} />
                : {massages.msg.length}</p>
            {massages.msg.map(
                (v, i) => {
                    return <p key={i} css={{ fontSize: "12px" }}>
                        *  {v}</p>
                })}
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

    </div>;
}