import { cacheRead, cacheWrite } from '../cache/localStorageCache'
import { CACHE_KEYS } from '../cache/cacheKeys'

export function readPeopleFromCache() {
  const data = cacheRead(CACHE_KEYS.PEOPLE, [])
  return Array.isArray(data) ? data : []
}

export function writePeople(people) {
  cacheWrite(CACHE_KEYS.PEOPLE, people)
}

export function getPersonById(people, personId) {
  return people.find((p) => p.id === personId) || null
}

export function updatePersonInList(people, personId, updates) {
  return people.map((p) => (p.id === personId ? { ...p, ...updates } : p))
}
