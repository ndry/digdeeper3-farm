import { ReadonlyDeep } from "../../utils/readonly-deep";


export const getRecordWalkerStep = (env: ReadonlyDeep<{
    tickCount: number,
    recordedSteps: Uint8Array, // Readonly<Uint8Array>
}>) => env.recordedSteps[env.tickCount] as 0 | 1 | 2 | 3;