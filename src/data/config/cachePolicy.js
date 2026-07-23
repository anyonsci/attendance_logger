/**
 * @typedef {{ ttlMs: number, enabled: boolean }} CachePolicy
 */

/**
 * Global default TTL: 24 hours.
 * To give a specific resource its own TTL, override its entry below.
 * e.g. notes: { ...GLOBAL_POLICY, ttlMs: 60 * 60 * 1000 }  → 1 hour
 */
const GLOBAL_POLICY = {
  ttlMs: 24 * 60 * 60 * 1000,
  enabled: true,
}

/** @type {Record<string, CachePolicy>} */
export const CACHE_POLICIES = {
  people:     { ...GLOBAL_POLICY },
  // attendance and notes are never cached server-side; always re-fetch.
  attendance: { ttlMs: 0, enabled: false },
  notes:      { ttlMs: 0, enabled: false },
}

/**
 * Returns true if the cache entry is still fresh under the given policy.
 * @param {CachePolicy} policy
 * @param {number | null} lastFetchedAt  Unix timestamp in ms
 */
export function isCacheFresh(policy, lastFetchedAt) {
  if (!policy.enabled || lastFetchedAt == null) return false
  return Date.now() - lastFetchedAt < policy.ttlMs
}
