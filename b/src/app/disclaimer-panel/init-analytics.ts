import { init, setOptOut as _setOptOut, Types } from "@amplitude/analytics-browser";
import { appVersion } from "~appVersion";
import { optOutAnalyticsRecoil } from "./opt-out-analytics-recoil";


const amplitudeApiKey = import.meta.env["VITE_AMPLITUDE_API_KEY"];
const analyticsEnabled = !!amplitudeApiKey && import.meta.env.PROD;
init(amplitudeApiKey ?? "stub", undefined, {
    appVersion: appVersion,
    optOut:
        JSON.parse(localStorage.getItem(optOutAnalyticsRecoil.key) ?? "false")
        || !analyticsEnabled,
    attribution: {
        trackPageViews: true,
    },

    ...(import.meta.env.DEV && {
        logLevel: Types.LogLevel.Verbose,
    }),
});

export const setOptOut = (optOut: boolean) =>
    _setOptOut(optOut || !analyticsEnabled);