import "@fontsource/noto-sans-mono";

export const retroThemeCss = [{
    fontFamily: "'Noto Sans Mono', monospace",
    color: "#00ff11",
}, /*css*/`
    & button {
        padding: 0px;
        border: none;
        color: #00ff11;
        background: #00ff1150;
        font-family: 'Noto Sans Mono', monospace;
        font-size: 1em;
        width: fit-content;
    }
    & button:hover {
        background: #00ff1160;
    }
    & button:active {
        background: #00ff1170;
    }
    & button::before {
        content: "[\\00a0\\00a0";
    }
    & button:focus::before {
        content: "[\\00a0-";
    }
    & button::after {
        content: "\\00a0\\00a0]";
    }
    & button:focus::after {
        content: "-\\00a0]";
    }

    & button:disabled {
        color: #00980a;
        background: #00ff1120;
    }
    & button:disabled:hover {
        background: #00ff1120;
    }

    & button.short::before {
        content: "[";
    }
    & button.short::after {
        content: "]";
    }
`];