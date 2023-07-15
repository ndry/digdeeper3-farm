
export const perf = new (class {
    _start = performance.now();
    _acc = 0;
    _count = 0;
    start() {
        this._start = performance.now();
    }
    stop() {
        this._acc += performance.now() - this._start;
        this._count++;
    }
    log() {
        console.log({
            perf: this._acc / this._count,
            acc: this._acc,
            count: this._count,
        });
    }
    reset() {
        this._acc = 0;
        this._count = 0;
    }
});
