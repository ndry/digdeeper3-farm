import { jsx } from "@emotion/react";
import { Check } from "@emotion-icons/fa-solid/Check";
import "@fontsource/noto-serif";
import { useRecoilState } from "recoil";
import { optOutAnalyticsRecoil } from "./opt-out-analytics-recoil";
import { optOutSubmissionRecoil } from "./opt-out-submission-recoil";
import { DisclaimerText } from "./disclaimer-text";
import { useResolveByLanguage } from "../language-recoil";
import { DisclaimerTextUk } from "./disclaimer-text-uk";


export function DisclaimerPanel({
    onClose,
    css: cssProp,
    ...props
}: jsx.JSX.IntrinsicElements["div"] & {
    onClose: () => void,
}) {
    const optOutSubmissionState = useRecoilState(optOutSubmissionRecoil);
    const optOutAnalyticsState = useRecoilState(optOutAnalyticsRecoil);

    const resolveByLanguage = useResolveByLanguage();
    const Text = resolveByLanguage({
        "en": DisclaimerText,
        "uk": DisclaimerTextUk,
    }) ?? DisclaimerText;

    return <div css={[{
        padding: "0 2vmin 1.5vmin 2vmin",
        fontSize: "1.5vmin",
        overflow: "auto",
        fontFamily: "'Noto Serif', serif",
        borderRadius: "1vmin",
        border: "0.2vmin solid #ffb986",
    }, /*css*/`
        & h3 {
            margin: 1em 0 -0.5em 0.5em;
            color: #cdb2ff;
        }
        & a {
            color: #cdb2ff;
        }
        & b {
            color: #ffb986;
        }
        & input {
            height: 1.6em;
            width: 1.6em;
            translate: 0 0.2em;
        }
    `, cssProp]}{...props}>
        <Text
            optOutSubmissionState={optOutSubmissionState}
            optOutAnalyticsState={optOutAnalyticsState}
        />
        <button
            css={{
                margin: "auto",
                display: "block",
                padding: "0.1em 2em",
            }}
            onClick={onClose}
        ><Check css={{ height: "2.5em" }} /></button>
    </div >;
}