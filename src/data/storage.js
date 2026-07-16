import api from '../api/client'

const STORAGE_KEY = 'attendance-logger-people'

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

function normalizeAttendanceMap(attendanceMap = {}) {
  return Object.entries(attendanceMap || {}).reduce((accumulator, [dateKey, status]) => {
    if (dateKey && status === 'Absent') {
      accumulator[dateKey] = status
    }
    return accumulator
  }, {})
}

function mergeAttendanceRecords(person, attendanceRecords = []) {
  const attendanceByDate = normalizeAttendanceMap(person?.attendance || {})

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
    console.error('Failed to delete attendance record on backend.', error)
    throw error
  }
}

async function refreshPeople() {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const [peopleResponse, attendanceResponse] = await Promise.all([
      api.get('/people'),
      getAttendanceRecordsRemote(),
    ])

    const serverPeople = Array.isArray(peopleResponse?.data) ? peopleResponse.data : []
    const cachedPeople = readPeopleFromCache()
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
      const mergedPerson = mergeAttendanceRecords(
        {
          ...(cachedPerson || {}),
          ...person,
        },
        backendAttendance
      )

      return mergedPerson
    })

    writePeople(mergedPeople)
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

    const nextPeople = readPeopleFromCache().filter((person) => person.id !== personId)
    writePeople(nextPeople)

    return true
  } catch (error) {
    console.error('Failed to delete person on backend.', error)
    throw error
  }
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

export {
  STORAGE_KEY,
  createPerson,
  createPersonRemote,
  deleteAttendanceRecordRemote,
  deletePersonRemote,
  getAttendanceRecordsRemote,
  getPersonById,
  mergeAttendanceRecords,
  readPeople,
  refreshPeople,
  saveAttendance,
  saveAttendanceRecordRemote,
  updatePerson,
  updatePersonRemote,
  writePeople,
}
