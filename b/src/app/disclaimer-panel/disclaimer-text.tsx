import { StateProp } from "../../utils/reactish/state-prop";


export function DisclaimerText({
    optOutSubmissionState: [optOutSubmission, setOptOutSubmission],
    optOutAnalyticsState: [optOutAnalytics, setOptOutAnalytics],
}: {
    optOutSubmissionState: StateProp<boolean>;
    optOutAnalyticsState: StateProp<boolean>;
}) {
    return <>
        <h3>
            # TODO
        </h3>
        <p>
            todo
        </p>
        <label>
            <input
                type="checkbox"
                checked={!optOutSubmission}
                onChange={e => setOptOutSubmission(!e.target.checked)}
            ></input>
            &nbsp;<b>Do submit anonymous solutions</b>
            <br />
            (Please mind this is a <b>vital</b> part of the research!)
        </label>
        <br />
        <h3># Analytics</h3>
        <p>
            The game gathers anonymous statistics on the user interactions
            using <a
                href="https://amplitude.com"
                target="_blank"
            >Amplitude</a> analytics.
        </p>
        <label>
            <input
                type="checkbox"
                checked={!optOutAnalytics}
                onChange={e => setOptOutAnalytics(!e.target.checked)}
            ></input>
            <b> Do send anonymous analytics</b>
            <br />
            (This just helps us to track and improve the gamer experience)
        </label>
        <br />
        <br />
        <h3># Disclaimer on progress loss</h3>
        <p>
            The game is in a stage of <b>active development</b>.
            It is playable, but a subject to heavy changes.
            The <b>settings and progress</b> are stored locally,
            not synchronized,
            and <b>can and would be lost</b> in case of breaking changes
            in future versions. This allows us to iterate much faster.
        </p>
    </>;
}
