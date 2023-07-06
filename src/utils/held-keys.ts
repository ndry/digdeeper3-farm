
export const heldKeys = {} as Partial<Record<string, boolean>>;

const onkeydown = (e: KeyboardEvent) => heldKeys[e.code] = true;
const onkeyup = (e: KeyboardEvent) => heldKeys[e.code] = false;

window.addEventListener("keydown", onkeydown);
window.addEventListener("keyup", onkeyup);

export const dispose = () => {
    window.removeEventListener("keydown", onkeydown);
    window.removeEventListener("keyup", onkeyup);
};
