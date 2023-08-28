import { retroThemeCss } from "../nb-2023-07-06/retro-theme-css";
import type * as CryptoJS from "crypto-js";
export type WordArray = CryptoJS.lib.WordArray;
import { ReactionCardListView } from "./app/reaction-card-list-view";
import { ReactorView } from "./app/reactor-view";

export default function Component() {
    return (
        <div css={[{
            fontSize: "0.71em",
            // display: "flex",
            // flexDirection: "column",
            padding: "1em",
        }, retroThemeCss]}>
            Hello World from {import.meta.url}
            <ReactorView />
            <div css={{
                display: "flex",
                flexDirection: "row",
                height: "90vh",
            }}>
                <div css={{
                    flex: "1",
                    overflowY: "auto",
                }}>
                    <ReactionCardListView num={0} />
                </div>
                <div css={{
                    flex: "1",
                    overflowY: "auto",
                }}>
                    <ReactionCardListView num={1} />
                </div>
            </div>

        </div >
    );
}