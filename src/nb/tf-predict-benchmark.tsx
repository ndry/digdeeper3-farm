import { retroThemeCss } from "./nb-2023-07-06/retro-theme-css";

// todo
// try load model from indexeddb
// if not found, train a model, save to indexeddb
// benchmark the prediction
// benchmark caching the prediction naively
// benchmark caching the prediction with a custom hasm map

export default function App() {
    return <div css={[{
        fontSize: "0.7em",
        padding: "1em",

        display: "flex",
        flexDirection: "column",
    }, retroThemeCss]}>
        123
    </div>;
}