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

async function refreshPeople() {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const response = await api.get('/people')
    const serverPeople = Array.isArray(response?.data) ? response.data : []
    const cachedPeople = readPeopleFromCache()
    const cachedById = new Map(cachedPeople.map((person) => [person.id, person]))

    const mergedPeople = serverPeople.map((person) => {
      const cachedPerson = cachedById.get(person.id)
      return {
        ...(cachedPerson || {}),
        ...person,
        attendance: cachedPerson?.attendance || {},
      }
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
  deletePersonRemote,
  getPersonById,
  readPeople,
  refreshPeople,
  saveAttendance,
  updatePerson,
  updatePersonRemote,
  writePeople,
}
