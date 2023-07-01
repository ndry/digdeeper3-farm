


export function _throw(message: string | unknown, ctor = Error): never {
    if ("string" === typeof message) { throw new ctor(message); }
    throw message;
}


