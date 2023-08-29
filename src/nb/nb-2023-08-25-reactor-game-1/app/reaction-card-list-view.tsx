import { jsx } from "@emotion/react";
import { useRecoilState } from "recoil";
import update from "immutability-helper";
import { reactionsRecoil, useGenerateReactionSeeds } from "./reactions-recoil";
import { ReactionCardView as _ReactionCardView } from "./reaction-card-view";
import { memo, useState } from "react";
import { getWidestSingleColorZone } from "../getWidestSingleColorZone";

const eqStringify = <T,>(p: T, n: T) =>
    JSON.stringify(p) === JSON.stringify(n);

const ReactionCardView = memo(_ReactionCardView, eqStringify);

export function ReactionCardListView({
    num = 0,
    ...props
}: jsx.JSX.IntrinsicElements["div"] & {
    num?: number,
}) {
    const [reactions, setReactions] = useRecoilState(reactionsRecoil);
    const generateReactionSeeds = useGenerateReactionSeeds();
    const [filter, setFilter] = useState([
        "run-pool",
        "repeated",
        "trashed",
    ][num] as "run-pool" | "trashed" | "repeated" | "custom" | "all");
    const filteredReactions = (() => {
        switch (filter) {
            case "run-pool": return reactions
                .filter(r => !r.isTrashed && r.repeatAt === undefined)
                .toSorted((a, b) => b.priority - a.priority);
            case "trashed": return reactions
                .filter(r => r.isTrashed);
            case "repeated": return reactions
                .filter(r => r.repeatAt !== undefined)
                .toSorted((a, b) => b.repeatAt! - a.repeatAt!);
            case "all":
            default:
                return reactions;
        }
    })();

    const [filterByColorMatch, setFilterByColorMatch] = useState(false);

    return <div {...props}>
        <select value={filter} onChange={e => setFilter(e.target.value as any)}>
            <option value="run-pool">run-pool</option>
            <option value="none">none</option>
            <option value="paused">paused</option>
            <option value="trashed">trashed</option>
            <option value="repeated">repeated</option>
            <option value="custom">custom</option>
        </select>
        <label css={{
            display: "inline-flex",
            alignItems: "center",
            marginLeft: "5px",
        }} >
            <input
                type="checkbox"
                onChange={
                    (e) => {
                        if (e.target.checked) {
                            setFilterByColorMatch(true);
                        }
                    }
                }
                css={{ margin: "0 5px 0 0 " }}
            />
            filter by color match
        </label>
        <br />
        List length: {filteredReactions.length} / {reactions.length}
        &nbsp;/&nbsp;
        Generate
        &nbsp;<button onClick={() => generateReactionSeeds(3)}>+3</button>
        &nbsp;<button onClick={() => generateReactionSeeds(10)}>+10</button>
        &nbsp;<button onClick={() => generateReactionSeeds(100)}>+100</button>
        {filteredReactions
            .map((r, i) => {
                const maxColorMatches =
                    getWidestSingleColorZone(r.reactionSeed, 500);

                return <> <ReactionCardView
                    key={i}
                    reactionCardState={[
                        r,
                        (r1) => setReactions(reactions => update(reactions, {
                            [reactions.indexOf(r)]: {
                                $set: typeof r1 === "function" ? r1(r) : r1,
                            },
                        }))]}
                    style={{
                        border: "1px solid #00ff0040",
                        margin: "1px",
                    }}
                />
                    <span> Max color matches:&nbsp;{maxColorMatches} </span>
                </>
            })}
    </div >;
}
