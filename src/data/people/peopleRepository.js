import api from '../../api/client'
import { assertPermission } from '../permissions/permissions'
import { CACHE_POLICIES, isCacheFresh } from '../config/cachePolicy'
import { cacheReadTimestamp, cacheWriteTimestamp } from '../cache/localStorageCache'
import { CACHE_KEYS } from '../cache/cacheKeys'
import { readPeopleFromCache, writePeople } from './peopleCache'
import { createPerson } from './peopleFactory'
import { getNotesRemote } from '../notes/notesRepository'

function replaceAttendanceRecords(person, attendanceRecords = []) {
  const attendanceByDate = {}
  attendanceRecords.forEach((record) => {
    if (record?.dateKey && record?.status === 'Absent') {
      attendanceByDate[record.dateKey] = record.status
    }
  })
  return { ...(person || {}), attendance: attendanceByDate }
}

export async function refreshPeople(ifNeeded = false) {
  assertPermission('people', 'read')
  const cachedPeople = readPeopleFromCache()

  if (ifNeeded && cachedPeople.length > 0) {
    const lastFetchedAt = cacheReadTimestamp(CACHE_KEYS.LAST_REFRESH_PEOPLE)
    if (isCacheFresh(CACHE_POLICIES.people, lastFetchedAt)) {
      return cachedPeople
    }
  }

  if (typeof window === 'undefined') return []

  try {
    const [peopleResponse, attendanceResponse] = await Promise.all([
      api.get('/people'),
      api.get('/attendance'),
    ])

    const serverPeople = Array.isArray(peopleResponse?.data) ? peopleResponse.data : []
    const attendanceList = Array.isArray(attendanceResponse?.data) ? attendanceResponse.data : []
    const cachedById = new Map(cachedPeople.map((p) => [p.id, p]))
    const attendanceByPerson = new Map()

    attendanceList.forEach((record) => {
      if (!record?.personId) return
      const next = attendanceByPerson.get(record.personId) || []
      next.push(record)
      attendanceByPerson.set(record.personId, next)
    })

    const mergedPeople = serverPeople.map((person) => {
      const cached = cachedById.get(person.id)
      return replaceAttendanceRecords(
        { ...(cached || {}), ...person },
        attendanceByPerson.get(person.id) || []
      )
    })

    writePeople(mergedPeople)
    await getNotesRemote()
    cacheWriteTimestamp(CACHE_KEYS.LAST_REFRESH_PEOPLE)
    return mergedPeople
  } catch (error) {
    console.error('Failed to refresh people from backend.', error)
    return readPeopleFromCache()
  }
}

export async function createPersonRemote(overrides = {}) {
  assertPermission('people', 'create')
  try {
    const payload = createPerson(overrides)
    const response = await api.post('/people', payload)
    return response?.data || null
  } catch (error) {
    console.error('Failed to create person on backend.', error)
    throw error
  }
}

export async function updatePersonRemote(personId, updates) {
  assertPermission('people', 'edit')
  try {
    const response = await api.put('/people', { id: personId, ...updates })
    return response?.data || null
  } catch (error) {
    console.error('Failed to update person on backend.', error)
    throw error
  }
}

export async function deletePersonRemote(personId) {
  assertPermission('people', 'delete')
  try {
    await api.delete('/people', { data: { id: personId } })
  } catch (error) {
    // For 404 error. Ignore the error and continue deleting from cache.
    if (error?.response?.status !== 404) {
      console.error('Failed to delete person on backend.', error)
      throw error
    }
  }

  const nextPeople = readPeopleFromCache().filter((p) => p.id !== personId)
  writePeople(nextPeople)
  return true
}
