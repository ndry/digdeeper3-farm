import Color from "color";


export const cssColorToAbgr = (() => {
    const cache = {} as Record<string, number>;
    const parse = (color: string) => {
        const c = Color(color);
        return (Math.floor(c.alpha() * 255) << 24)
            | (c.blue() << 16)
            | (c.green() << 8)
            | (c.red() << 0);
    };
    return (color: string) => cache[color] ??= parse(color);
})();


export const createImageData32 = (imageData: ImageData) => {
    const data32 = new Uint32Array(imageData.data.buffer);

    const setPixelAbgr = (x: number, y: number, abgr: number) =>
        data32[y * imageData.width + x] = abgr;

    const setPixel = (x: number, y: number, cssColor: string) =>
        setPixelAbgr(x, y, cssColorToAbgr(cssColor));

    return { data32, setPixel, setPixelAbgr };
};


export const createFullCanvasImageData32 = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) { throw new Error("no ctx"); }
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    return {
        canvas,
        ctx,
        imageData,
        ...createImageData32(imageData),
        put() { ctx.putImageData(imageData, 0, 0); },
    };
};
