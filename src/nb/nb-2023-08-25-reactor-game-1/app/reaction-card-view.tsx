import { jsx } from "@emotion/react";
import update, { Spec } from "immutability-helper";
import { ReactionCard } from "../model/reaction-card";
import jsonBeautify from "json-beautify";
import { JsonButton } from "../../nb-2023-08-13-reactor-game/json-button";
import { StateProp } from "../../../utils/reactish/state-prop";
import { LinkCaPreview } from "../../nb-2023-08-13-reactor-game/link-ca-preview";
import { ReactionCardCanvas } from "./reaction-card-canvas";


const update1 = <T,>(spec: Spec<T>) => (obj: T) => update(obj, spec);

const updReactionCardPriority = (
    priority: ((p: number) => number) | number,
) => (
    reaction: ReactionCard,
) => update(reaction, {
    priority: {
        $set: typeof priority === "function"
            ? priority(reaction.priority)
            : priority,
    },
});

export function ReactionCardView({
    reactionCardState: [reactionCard, setReactionCard],
    ...props
}: jsx.JSX.IntrinsicElements["div"] & {
    reactionCardState: StateProp<ReactionCard>;
}) {
    const {
        priority,
        isPaused,
        isTrashed,
        repeatAt,
        t,
        reactionSeed: {
            rule,
            reagent0,
            reagent1,
        },
        ...rest
    } = reactionCard;
    return <div {...props}>
        &#x2b4d;<LinkCaPreview substance={rule} />
        &nbsp;+ &#x269B;<LinkCaPreview substance={reagent0} />
        &nbsp;+ &#x269B;<LinkCaPreview substance={reagent1} />
        &nbsp;<button
            onClick={() =>
                setReactionCard(update1({ isPaused: { $apply: p => !p } }))}
        >{isPaused ? "Resume" : "Pause"}</button>
        <button
            onClick={() =>
                setReactionCard(update1({ isTrashed: { $apply: p => !p } }))}
        >{isTrashed ? "Restore" : "Trash"}</button>
        <br />
        P {priority.toString().padStart(4, ".")}
        &nbsp;
        <button className="short" onClick={() => setReactionCard(updReactionCardPriority(p => p + 1))}>+1</button>
        <button className="short" onClick={() => setReactionCard(updReactionCardPriority(p => p + 10))}>+10</button>
        <button className="short" onClick={() => setReactionCard(updReactionCardPriority(p => p + 100))}>+100</button>
        <button className="short" onClick={() => setReactionCard(updReactionCardPriority(p => p + 1000))}>+1k</button>
        /
        <button className="short" onClick={() => setReactionCard(updReactionCardPriority(p => p - 1))}>-1</button>
        <button className="short" onClick={() => setReactionCard(updReactionCardPriority(p => p - 10))}>-10</button>
        <button className="short" onClick={() => setReactionCard(updReactionCardPriority(p => p - 100))}>-100</button>
        <button className="short" onClick={() => setReactionCard(updReactionCardPriority(p => p - 1000))}>-1k</button>
        /
        <button className="short" onClick={() => setReactionCard(updReactionCardPriority(1))}>=1</button>
        <button className="short" onClick={() => setReactionCard(updReactionCardPriority(10))}>=10</button>
        <button className="short" onClick={() => setReactionCard(updReactionCardPriority(100))}>=100</button>
        <button className="short" onClick={() => setReactionCard(updReactionCardPriority(1000))}>=1k</button>
        <br />
        t: {t} / repeatAt: {repeatAt ?? "?"} /
        &nbsp;<JsonButton obj={reactionCard} />
        <br />
        <ReactionCardCanvas reactionCard={reactionCard} />
        {Object.keys(rest).length > 0
            && <pre>rest: {jsonBeautify(rest, null as any, 2, 80)}</pre>}
    </div>;
}
