import { cacheRead, cacheWrite } from '../cache/localStorageCache'
import { CACHE_KEYS } from '../cache/cacheKeys'

export function readNotesFromCache(personId = '') {
  const cache = cacheRead(CACHE_KEYS.NOTES, {})
  if (personId) {
    return Array.isArray(cache[personId]) ? cache[personId] : []
  }
  return Object.values(cache).flatMap((notes) => (Array.isArray(notes) ? notes : []))
}

export function writeNotesToCache(personId = '', notes = []) {
  try {
    if (personId) {
      const cache = cacheRead(CACHE_KEYS.NOTES, {})
      cache[personId] = notes
      cacheWrite(CACHE_KEYS.NOTES, cache)
      return
    }
    const fullCache = Object.groupBy(notes, (note) => note.personId)
    cacheWrite(CACHE_KEYS.NOTES, fullCache)
  } catch (error) {
    console.error('Failed to write notes to cache.', error)
  }
}
