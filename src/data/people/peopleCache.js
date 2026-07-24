import { cacheRead, cacheWrite } from '../cache/localStorageCache'
import { CACHE_KEYS } from '../cache/cacheKeys'
import { getWorkspaceId } from '../workspace/workspaceContext'

export function readPeopleFromCache() {
  const data = cacheRead(CACHE_KEYS.PEOPLE, [])
  const list = Array.isArray(data) ? data : []
  const activeWorkspaceId = getWorkspaceId()
  if (!activeWorkspaceId) {
    return list
  }
  return list.filter((p) => p.workspaceId === activeWorkspaceId)
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
