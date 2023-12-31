import { ReadonlyDeep } from "../../utils/readonly-deep";


export const getRecordWalkerStep = (env: ReadonlyDeep<{
    stepCount: number,
    recordedSteps: Uint8Array, // Readonly<Uint8Array>
}>) => env.recordedSteps[env.stepCount] as 0 | 1 | 2 | 3;