import { _throw } from "./_throw";


export const _never = (msg?: string) =>
    _throw("Unreachable code was reached" + (msg ? `: ${msg}` : ""));
