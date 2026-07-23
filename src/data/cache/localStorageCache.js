const isBrowser = () => typeof window !== 'undefined'

export function cacheRead(key, fallback = null) {
  if (!isBrowser()) return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function cacheWrite(key, value) {
  if (!isBrowser()) return
  window.localStorage.setItem(key, JSON.stringify(value))
}

export function cacheRemove(key) {
  if (!isBrowser()) return
  window.localStorage.removeItem(key)
}

export function cacheReadTimestamp(key) {
  if (!isBrowser()) return null
  const raw = window.localStorage.getItem(key)
  return raw ? parseInt(raw, 10) : null
}

export function cacheWriteTimestamp(key) {
  if (!isBrowser()) return
  window.localStorage.setItem(key, Date.now().toString())
}
