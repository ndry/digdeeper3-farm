import { keyifyTable, parseTable } from "../../ca237v1/rule-io";
import { getFullCombinedState } from "../../ca237v1/get-full-combined-state";
import { stateCount } from "../../ca237v1/state-count";
import { ReactionCanvas } from "./reaction-canvas";
import { Reaction, generateReactionSpacetime, runReaction } from "./reaction";
import { getEnergyDelta } from "./get-energy-delta";
import { SubstanceView } from ".";
import { useMemo, useState } from "react";
import jsonBeautify from "json-beautify";


export function ReactionView({
    reaction,
}: {
    reaction: Reaction;
}) {
    const { rule, reagent1, reagent2, t } = reaction;
    const reactionRun = useMemo(() => runReaction(reaction), [reaction]);
    const spacetime = reactionRun.spacetime;

    const [selectedSpace, setSelectedSpace] = useState(0);

    const selectionStart =
        Math.min(
            Math.max(0, selectedSpace - 5),
            spacetime.length - 5 * 2 - 1);
    const spacetimeToDisplay = reactionRun.spacetimeExtended.slice(
        selectionStart,
        selectionStart + 5 * 2 + 1);


    // let acc = 0;

    return <div
        css={{
            border: "1px solid #00ff0044",
            padding: "0.5em",
        }}
    >

        Reaction (E: {reactionRun.energyTotal}):
        <br />
        | &#x2B4D;<SubstanceView substance={rule} />
        <br />
        | &#x269B;<SubstanceView substance={reagent1} />
        <br />
        | &#x269B;<SubstanceView substance={reagent2} />
        <br />
        | &nbsp;&nbsp;&nbsp;&#x21d3;&nbsp;&#x21d3;&nbsp;&#x21d3;&nbsp;&#x21d3;
        <br />
        | &#x269B;<SubstanceView
            substance={keyifyTable(spacetime[spacetime.length - 2])} />
        <br />
        | &#x269B;<SubstanceView
            substance={keyifyTable(spacetime[spacetime.length - 1])} />

        <br />
        <br />
        {spacetimeToDisplay.map((space, i) => <div key={i}>
            &#x269B;
            &nbsp;{(i - 1 + selectionStart).toString().padStart(3, ".")}&nbsp;
            <SubstanceView
                substance={keyifyTable(space.space)} />
            &nbsp;/&nbsp;
            {space.energyDelta}
            &nbsp;/&nbsp;
            {space.energySubtotal}
        </div>)}
        <div
            css={{
                overflowX: "auto",
            }}
            title={jsonBeautify(reaction, null as any, 2, 80)}
        >
            <ReactionCanvas
                onSpaceSelected={t => setSelectedSpace(t)}
                reactionRun={reactionRun}
            />
        </div>
    </div>;
}
