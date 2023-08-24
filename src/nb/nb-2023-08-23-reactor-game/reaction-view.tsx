import { keyifyTable, parseTable } from "../../ca237v1/rule-io";
import { getFullCombinedState } from "../../ca237v1/get-full-combined-state";
import { stateCount } from "../../ca237v1/state-count";
import { SpacetimeCanvas } from "./spacetime-canvas";
import { Reaction, generateReactionSpacetime } from "./reaction";
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
    const spacetime = useMemo(
        () => generateReactionSpacetime(reaction),
        [reaction]);

    const [selectedSpace, setSelectedSpace] = useState(0);

    const selectionStart =
        Math.min(
            Math.max(0, selectedSpace - 5),
            spacetime.length - 5 * 2 - 1);
    const spacetimeToDisplay = spacetime.slice(
        selectionStart,
        selectionStart + 5 * 2 + 1);


    // let acc = 0;

    return <div
        css={{
            border: "1px solid #00ff0044",
            padding: "0.5em",
        }}
    >

        Reaction: <br />
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
                substance={keyifyTable(space)} />
            &nbsp;/&nbsp;
            {i > 1 && getEnergyDelta(space, spacetimeToDisplay[i - 1])}
            &nbsp;/&nbsp;
            {/* {i > 1 && (acc += getEnergyDelta(space, spacetime[i - 1]))} */}
        </div>)}
        <div
            css={{
                overflowX: "auto",
            }}
            title={jsonBeautify(reaction, null as any, 2, 80)}
        >
            <SpacetimeCanvas
                onSpaceSelected={t => setSelectedSpace(t)}
                spacetime={spacetime}
            />
        </div>
    </div>;
}
