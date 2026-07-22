import api from '../api/client'

const STORAGE_KEY = 'attendance-logger-people'
const NOTES_STORAGE_KEY = 'attendance-logger-notes'

function readPeopleFromCache() {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writePeople(people) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(people))
}

function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `person-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function createPerson(overrides = {}) {
  return {
    id: createId(),
    name: 'New person',
    salary: '',
    allowedLeavesPerMonth: '',
    reportTime: '09:00',
    duration: 8,
    durationUnit: 'hour',
    attendance: {},
    ...overrides,
  }
}

function readPeople() {
  return readPeopleFromCache()
}

async function getAttendanceRecordsRemote(personId = '') {
  try {
    const response = await api.get('/attendance', {
      params: personId ? { personId } : {},
    })

    return Array.isArray(response?.data) ? response.data : []
  } catch (error) {
    console.error('Failed to load attendance records from backend.', error)
    return []
  }
}

function replaceAttendanceRecords(person, attendanceRecords = []) {
  const attendanceByDate = {}

  attendanceRecords.forEach((record) => {
    if (record?.dateKey && record?.status === 'Absent') {
      attendanceByDate[record.dateKey] = record.status
    }
  })

  return {
    ...(person || {}),
    attendance: attendanceByDate,
  }
}

async function saveAttendanceRecordRemote(personId, dateKey, status) {
  if (!personId || !dateKey || status !== 'Absent') {
    return null
  }

  try {
    const response = await api.put('/attendance', {
      personId,
      dateKey,
      status,
    })

    return response?.data || null
  } catch (error) {
    console.error('Failed to save attendance record on backend.', error)
    throw error
  }
}

async function deleteAttendanceRecordRemote(personId, dateKey) {
  try {
    const response = await api.delete('/attendance', {
      data: { personId, dateKey },
    })

    return response?.data || null
  } catch (error) {
    if (error?.response?.status === 404) {
      return { success: true }
    }
    console.error('Failed to delete attendance record on backend.', error)
    throw error
  }
}

async function refreshPeople(ifNeeded = false) {
  const cachedPeople = readPeopleFromCache()
  if (ifNeeded && cachedPeople.length > 0) {
    const lastRefreshTime = window.localStorage.getItem('last_refresh_time')
    // Skip refresh and return cached people if last refresh was within 1 day.
    if (lastRefreshTime && Date.now() - parseInt(lastRefreshTime, 10) < 24 * 60 * 60 * 1000) {
      return cachedPeople
    }
  }

  if (typeof window === 'undefined') {
    return []
  }

  try {
    const [peopleResponse, attendanceResponse] = await Promise.all([
      api.get('/people'),
      getAttendanceRecordsRemote(),
    ])

    const serverPeople = Array.isArray(peopleResponse?.data) ? peopleResponse.data : []
    const cachedById = new Map(cachedPeople.map((person) => [person.id, person]))
    const attendanceByPerson = new Map()

    attendanceResponse.forEach((record) => {
      if (!record?.personId) {
        return
      }

      const nextRecords = attendanceByPerson.get(record.personId) || []
      nextRecords.push(record)
      attendanceByPerson.set(record.personId, nextRecords)
    })

    const mergedPeople = serverPeople.map((person) => {
      const cachedPerson = cachedById.get(person.id)
      const backendAttendance = attendanceByPerson.get(person.id) || []
      const mergedPerson = replaceAttendanceRecords(
        {
          ...(cachedPerson || {}),
          ...person,
        },
        backendAttendance
      )

      return mergedPerson
    })

    writePeople(mergedPeople)
    const _ = await getNotesRemote()

    window.localStorage.setItem('last_refresh_time', Date.now().toString())
    return mergedPeople
  } catch (error) {
    console.error('Failed to refresh people from backend.', error)
    return readPeopleFromCache()
  }
}

async function createPersonRemote(overrides = {}) {
  try {
    const payload = createPerson(overrides)
    const response = await api.post('/people', payload)
    return response?.data || null
  } catch (error) {
    console.error('Failed to create person on backend.', error)
    throw error
  }
}

async function updatePersonRemote(personId, updates) {
  try {
    const response = await api.put('/people', { id: personId, ...updates })
    return response?.data || null
  } catch (error) {
    console.error('Failed to update person on backend.', error)
    throw error
  }
}

async function deletePersonRemote(personId) {
  try {
    await api.delete('/people', { data: { id: personId } })
  } catch (error) {
    if (error?.response?.status !== 404) {
      console.error('Failed to delete person on backend.', error)
      throw error
    }
  }

  const nextPeople = readPeopleFromCache().filter((person) => person.id !== personId)
  writePeople(nextPeople)

  return true
}

function updatePerson(people, personId, updates) {
  return people.map((person) => (person.id === personId ? { ...person, ...updates } : person))
}

function getPersonById(people, personId) {
  return people.find((person) => person.id === personId) || null
}

function saveAttendance(people, personId, dateKey, status) {
  return people.map((person) => {
    if (person.id !== personId) {
      return person
    }

    return {
      ...person,
      attendance: {
        ...person.attendance,
        [dateKey]: status,
      },
    }
  })
}

function readNotesFromCache(personId = '') {
  if (typeof window === 'undefined') return []

  try {
    const cache = JSON.parse(window.localStorage.getItem(NOTES_STORAGE_KEY) || '{}')

    // 1. If personId is provided, return their notes array directly
    if (personId) {
      return Array.isArray(cache[personId]) ? cache[personId] : []
    }

    // 2. Otherwise, flatten all arrays in the cache into a single array
    return Object.values(cache).flatMap(notes => Array.isArray(notes) ? notes : [])
  } catch {
    return []
  }
}

function writeNotesToCache(personId = '', notes = []) {
  if (typeof window === 'undefined') return

  try {
    // 1. If updating a specific person, merge into existing cache
    if (personId) {
      const raw = window.localStorage.getItem(NOTES_STORAGE_KEY)
      const cache = JSON.parse(raw || '{}')
      cache[personId] = notes

      window.localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(cache))
      return
    }

    // 2. If personId == '', rebuild and replace the full cache from the notes array
    const fullCache = Object.groupBy(notes, (note) => note.personId)
    
    window.localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(fullCache))
  } catch (error) {
    console.error('Failed to write notes to cache.', error)
  }
}

async function getNotesRemote(personId = '') {
  try {
    const response = await api.get('/notes', {
      params: personId ? { personId } : {},
    })
    const loadedNotes = Array.isArray(response?.data) ? response.data : []
    writeNotesToCache(personId, loadedNotes)
    return loadedNotes
  } catch (error) {
    console.error('Failed to load notes from backend.', error)
    return cachedNotes
  }
}

async function saveNoteRemote(noteData) {
  try {
    const noteId = noteData.id || noteData._id
    let response
    if (noteId) {
      response = await api.put('/notes', { ...noteData, id: noteId })
    } else {
      response = await api.post('/notes', noteData)
    }

    const savedNote = response?.data || null
    if (savedNote) {
      const personIdKey = savedNote.personId || noteData.personId || ''
      const cached = readNotesFromCache(personIdKey)
      const targetId = savedNote._id || savedNote.id || noteId
      const index = cached.findIndex((n) => (n._id || n.id) === targetId)
      let updated
      if (index >= 0) {
        updated = [...cached]
        updated[index] = savedNote
      } else {
        updated = [savedNote, ...cached]
      }
      writeNotesToCache(personIdKey, updated)
    }

    return savedNote
  } catch (error) {
    console.error('Failed to save note on backend.', error)
    throw error
  }
}

async function deleteNoteRemote(noteId, personId = '') {
  try {
    const response = await api.delete('/notes', {
      data: { id: noteId },
    })

    if (personId) {
      const cached = readNotesFromCache(personId)
      const updated = cached.filter((n) => (n._id || n.id) !== noteId)
      writeNotesToCache(personId, updated)
    } else {
      try {
        const raw = window.localStorage.getItem(NOTES_STORAGE_KEY)
        if (raw) {
          const cache = JSON.parse(raw)
          for (const key in cache) {
            if (Array.isArray(cache[key])) {
              cache[key] = cache[key].filter((n) => (n._id || n.id) !== noteId)
            }
          }
          window.localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(cache))
        }
      } catch {}
    }

    return response?.data || null
  } catch (error) {
    if (error?.response?.status === 404) {
      if (personId) {
        const cached = readNotesFromCache(personId)
        const updated = cached.filter((n) => (n._id || n.id) !== noteId)
        writeNotesToCache(personId, updated)
      }
      return { success: true }
    }
    console.error('Failed to delete note on backend.', error)
    throw error
  }
}

export {
  STORAGE_KEY,
  NOTES_STORAGE_KEY,
  createPerson,
  createPersonRemote,
  deleteAttendanceRecordRemote,
  deleteNoteRemote,
  deletePersonRemote,
  getAttendanceRecordsRemote,
  getNotesRemote,
  getPersonById,
  readNotesFromCache,
  readPeople,
  refreshPeople,
  saveAttendance,
  saveAttendanceRecordRemote,
  saveNoteRemote,
  updatePerson,
  updatePersonRemote,
  writeNotesToCache,
  writePeople,
}

