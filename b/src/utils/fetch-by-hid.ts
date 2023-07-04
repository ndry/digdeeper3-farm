import memoize from "memoizee";


export async function fetchByHid(hid: string) {
    return (await fetch(`https://dd3.x-pl.art/hid_kv/${hid}/json`)).json();
}

/**
 * hid_kv content, once set, is ment to be immutable,
 * so the cache policy is to cache for ever.
 * But ~1k items still take time to fetch from the browser cache.
 * This function additionally caches the results in memory.
 */
export const fetchByHidMemoized = memoize(async (hid: string) => {
    const res = await fetch(`https://dd3.x-pl.art/hid_kv/${hid}/json`);
    if (!res.headers.get("Cache-Control")?.includes("immutable")) {
        fetchByHidMemoized.delete(hid);
    }
    return res.json();
}, { promise: true, max: 10 * 1000 });
