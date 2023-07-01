import { version } from "./version";

export type Code = {
    v: typeof version;
    stateCount: number;
    rule: string;
}