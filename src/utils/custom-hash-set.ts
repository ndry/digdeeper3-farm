const bucketTag = Symbol();

type Bucket<T> = T[] & { [bucketTag]: true };

const newBucket = <T>(el1: T, el2: T) => {
    const bucket = [el1, el2] as any;
    bucket[bucketTag] = true;
    return bucket as Bucket<T>;
};

const isBucket = <T>(b: T | Bucket<T>): b is Bucket<T> =>
    Array.isArray(b) && (bucketTag in b);

/**
 * A set that uses a custom hash function and a custom equality function.
 * Implementation is optimized for performance.
 */
export class CustomHashSet<T, THash> {
    private readonly _hashFn: (el: T) => THash;
    private readonly _equalsFn: (el1: T, el2: T) => boolean;
    private readonly _verbose: boolean | undefined;

    constructor({
        hashFn, equalsFn, verbose,
    }: {
        hashFn: (el: T) => THash;
        equalsFn: (el1: T, el2: T) => boolean;
        verbose?: boolean;
    }) {
        this._hashFn = hashFn;
        this._equalsFn = equalsFn;
        this._verbose = verbose;
    }

    private readonly _buckets = new Map<THash, Bucket<T> | T>();
    private _size = 0;

    private _maxBucketLength = 0;
    registerBucketLength(len: number) {
        if (len <= this._maxBucketLength) { return; }
        this._maxBucketLength = len;
        this._verbose
            && this._maxBucketLength > 1
            && console.log("new maxBucketLength", this._maxBucketLength);
    }

    has(el: T) {
        const hash = this._hashFn(el);
        const bucket = this._buckets.get(hash);
        if (bucket) {
            if (isBucket(bucket)) {
                for (const bel of bucket) {
                    if (this._equalsFn(el, bel)) { return true; }
                }
            } else {
                if (this._equalsFn(el, bucket)) { return true; }
            }
        }
        return false;
    }

    get(el: T) {
        const hash = this._hashFn(el);
        const bucket = this._buckets.get(hash);
        if (bucket) {
            if (isBucket(bucket)) {
                for (const bel of bucket) {
                    if (this._equalsFn(el, bel)) { return bel; }
                }
            } else {
                if (this._equalsFn(el, bucket)) { return bucket; }
            }
        }
        return undefined;
    }

    /**
     * @returns `true` if the set size changed
     *   (i.e. the element was not already in the set)
     */
    add(el: T) {
        const hash = this._hashFn(el);
        const bucket = this._buckets.get(hash);
        if (bucket) {
            if (isBucket(bucket)) {
                for (const bel of bucket) {
                    if (this._equalsFn(el, bel)) { return false; }
                }

                const len = bucket.push(el);
                this.registerBucketLength(len);
                this._size++;
                return true;
            } else {
                if (this._equalsFn(el, bucket)) { return false; }

                this._buckets.set(hash, newBucket(bucket, el));
                this.registerBucketLength(2);
                this._size++;
                return true;
            }
        } else {
            this._buckets.set(hash, el);
            this.registerBucketLength(1);
            this._size++;
            return true;
        }
    }

    /**
     * @returns `true` if the set size changed
     *   (i.e. the element was in the set)
     */
    delete(el: T) {
        const hash = this._hashFn(el);
        const bucket = this._buckets.get(hash);
        if (!bucket) { return false; }
        if (isBucket(bucket)) {
            for (let i = bucket.length - 1; i >= 0; i--) {
                if (this._equalsFn(el, bucket[i])) {
                    bucket.splice(i, 1);
                    this._size--;
                    if (bucket.length === 1) {
                        this._buckets.set(hash, bucket[0]);
                    }
                    if (bucket.length === 0) {
                        this._buckets.delete(hash);
                    }
                    return true;
                }
            }
        } else {
            if (this._equalsFn(el, bucket)) {
                this._buckets.delete(hash);
                this._size--;
                return true;
            }
        }
        return false;
    }

    filterInPlace(fn: (el: T) => unknown) {
        for (const [k, b] of this._buckets) {
            if (isBucket(b)) {
                for (let i = b.length - 1; i >= 0; i--) {
                    if (!fn(b[i])) {
                        b.splice(i, 1);
                        this._size--;
                    }
                }
                if (b.length === 1) {
                    this._buckets.set(k, b[0]);
                }
                if (b.length === 0) {
                    this._buckets.delete(k);
                }
            } else {
                if (!fn(b)) {
                    this._buckets.delete(k);
                    this._size--;
                }
            }
        }
    }

    *[Symbol.iterator]() {
        for (const b of this._buckets.values()) {
            if (isBucket(b)) {
                // yield *b; - causes a lot of  overhead
                for (let i = 0; i < b.length; i++) {
                    yield b[i];
                }
            } else {
                yield b;
            }
        }
    }

    get size() { return this._size; }
}
