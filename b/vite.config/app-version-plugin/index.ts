import getRepoInfo from "git-repo-info";
import path from 'node:path';
import { Plugin, ResolvedConfig } from "vite";
import { promises as fs } from "node:fs";


function compactBuildTime({ date, anchorYear }: {
    date: Date,
    anchorYear: number,
}) {
    const digits = "0123456789abcdefghijklmnopqrstuvwxyz";

    /**
     * @param anchorYear the year of the beginning of the relevant time
     * @param date current date
     * @returns 
     *    `0..z` if current year relative to anchor year fits into the range,
     *    `00[m]yyyya` (e.g. 1999 -> 001999a) otherwise 
     */
    const relYearStr = ((anchorYear: number, date: Date) => {
        const year = date.getUTCFullYear();
        const relYear = year - anchorYear;
        if (relYear < 0 || relYear >= digits.length) {
            const _0 = digits[0];
            const _a = digits[10];
            const mYearStr = year.toString().replace("-", "m");

            return _0 + _0 + mYearStr + _a;
        }
        return digits[relYear];
    })(anchorYear, date);

    const monthStr = digits[date.getUTCMonth() + 1]; // Jan is 1, Dec is c=12
    const dayStr = digits[date.getUTCDate()]; // 1, 2, ..., 9, a, b, ..., v=31

    const fractionOfDay = ((date) => {
        const startOfDay = new Date(date.toISOString().split("T")[0]);
        const millisecondOfDay = date.getTime() - startOfDay.getTime();
        const millisecondsPerDay = 24 * 60 * 60 * 1000;
        const fractionOfDay = millisecondOfDay / millisecondsPerDay;
        return fractionOfDay;
    })(date);
    const fractionOfDayStr = fractionOfDay.toString()
        .substring(2, 6); // 4 digits of precision give resolution of ~9 sec

    return relYearStr + monthStr + dayStr + fractionOfDayStr;
}

export function appVersionPlugin(option: {
    root?: string,
    mode?: string,
} = {}) {
    let config = undefined as undefined | ResolvedConfig;

    const buildTime = new Date();
    const buildTimeStr = compactBuildTime({
        date: buildTime,
        anchorYear: 2020,
    });
    const root = path.resolve(option?.root ?? process.cwd());
    const info = getRepoInfo(root);
    const appVersion = "0"
        + `+${buildTimeStr}-${info.abbreviatedSha}`;

    return {
        name: "app-version",
        appVersion,
        resolveId(id: string) {
            if (id !== "~appVersion") { return; }
            return "\0" + id;
        },
        load(id: string) {
            if (id !== "\0~appVersion") { return; }
            return `export const appVersion = ${JSON.stringify(appVersion)};`;
        },
        configResolved(_config) { config = _config; },
        async closeBundle() {
            if (config === undefined) { return; }
            if (config.command === 'serve') { return; }

            await fs.mkdir(config.build.outDir, { recursive: true });
            await fs.writeFile(
                path.join(config.build.outDir, "appVersion.txt"),
                appVersion,
            );
        },
    } as Plugin;
}