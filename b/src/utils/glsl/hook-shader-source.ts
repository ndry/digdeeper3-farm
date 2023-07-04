/**
 * Last resort shader source code manipulation,
 * right before it is sent to the GPU.
 */


type Hook = (source: string) => string | void | undefined;

export const hooks = {} as Record<string, Hook>;

export const setup = (
    ctx: WebGLRenderingContext | WebGL2RenderingContext,
) => {
    const shaderSource = ctx.shaderSource;
    ctx.shaderSource = function (shader, source) {
        return shaderSource.call(
            this,
            shader,
            source
                .matchAll(/shaderSourceHook:(\w+)/g)
                .reduce((source, [, hookName]) =>
                    hooks[hookName](source) ?? source,
                    source));
    };
    return () => { ctx.shaderSource = shaderSource; };
};

export const register = (
    hook: Hook,
    hookName = `_hook${Object.keys(hooks).length}`,
) => {
    hooks[hookName] = hook;
    return (source: string) => source + `// shaderSourceHook:${hookName};`;
};


export const logHook = register(source => {
    // eslint-disable-next-line no-console
    console.log(source);
}, "logHook");