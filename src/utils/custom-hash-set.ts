export function CustomHashSet<T, THash>({
    hashFn, equalsFn, verbose,
}: {
    hashFn: (el: T) => THash;
    equalsFn: (el1: T, el2: T) => boolean;
    verbose?: boolean;
}) {
    const bucketTag = Symbol();
    type Bucket = T[] & { [bucketTag]: true };
    const isBucket = (b: T | Bucket): b is Bucket =>
        Array.isArray(b) && (bucketTag in b);
    const newBucket = (el1: T, el2: T) => {
        const bucket = [el1, el2] as any;
        bucket[bucketTag] = true;
        return bucket as Bucket;
    };

    const buckets = new Map<THash, Bucket | T>();

    let maxBucketLength = 0;
    const registerBucketLength = (len: number) => {
        if (len <= maxBucketLength) { return; }
        maxBucketLength = len;
        verbose && console.log("new maxBucketLength", maxBucketLength);
    };

    let size = 0;

    return {
        has: (el: T) => {
            const hash = hashFn(el);
            const bucket = buckets.get(hash);
            if (bucket) {
                if (isBucket(bucket)) {
                    for (const bel of bucket) {
                        if (equalsFn(el, bel)) { return true; }
                    }
                } else {
                    if (equalsFn(el, bucket)) { return true; }
                }
            }
            return false;
        },

        /**
         * @returns true if the set size changed
         *   (i.e. the element was not already in the set)
         */
        add: (el: T) => {
            const hash = hashFn(el);
            const bucket = buckets.get(hash);
            if (bucket) {
                if (isBucket(bucket)) {
                    for (const bel of bucket) {
                        if (equalsFn(el, bel)) { return false; }
                    }

                    const len = bucket.push(el);
                    registerBucketLength(len);
                    size++;
                    return true;
                } else {
                    if (equalsFn(el, bucket)) { return false; }

                    buckets.set(hash, newBucket(bucket, el));
                    registerBucketLength(2);
                    size++;
                    return true;
                }
            } else {
                buckets.set(hash, el);
                registerBucketLength(1);
                size++;
                return true;
            }
        },

        filterInPlace: (fn: (el: T) => unknown) => {
            for (const [k, b] of buckets) {
                if (isBucket(b)) {
                    for (let i = b.length - 1; i >= 0; i--) {
                        if (!fn(b[i])) {
                            b.splice(i, 1);
                            size--;
                        }
                    }
                    if (b.length === 1) {
                        buckets.set(k, b[0]);
                    }
                    if (b.length === 0) {
                        buckets.delete(k);
                    }
                } else {
                    if (!fn(b)) {
                        buckets.delete(k);
                        size--;
                    }
                }
            }
        },

        [Symbol.iterator]: function* () {
            for (const b of buckets.values()) {
                if (isBucket(b)) {
                    // yield *b; - causes a lot of  overhead
                    for (let i = 0; i < b.length; i++) {
                        yield b[i];
                    }
                } else {
                    yield b;
                }
            }
        },

        get size() { return size; },
    };
}
