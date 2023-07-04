import { Object } from "ts-toolbelt";


export type ReadonlyDeep<T extends object> = 
    Object.Readonly<T, keyof T, "deep">;
