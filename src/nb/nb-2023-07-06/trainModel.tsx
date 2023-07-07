import { run } from "./run";


export function trainModel({ runArgs }: {
    runArgs: Parameters<typeof run>[0];
}) {
    console.log({ runArgs });
}
