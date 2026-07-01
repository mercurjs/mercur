// Cache lifetimes in seconds, passed to next/cache `cacheLife`.
//
// Model (same as brandyour): cache effectively forever and rely on tag-based
// purge (via /api/revalidate) for freshness — TTL is not the invalidation
// mechanism. Both windows are one year, matching brandyour's
// `s-maxage=31536000` data cache.
export const REVALIDATE = 31536000; // 1 year
export const EXPIRE = 31536000; // 1 year
