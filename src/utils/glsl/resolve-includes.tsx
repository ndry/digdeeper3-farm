import { ShaderChunk } from "three";


// based on https://github.com/mrdoob/three.js/blob/b9bc47ab1978022ab0947a9bce1b1209769b8d91/src/renderers/webgl/WebGLProgram.js#L204
export const resolveIncludes = (string: string): string =>
    string.replace(
        /^[ \t]*#include +<([\w\d./]+)>/gm,
        (_, include) => resolveIncludes(
            (ShaderChunk as Record<string, string>)[include]));
