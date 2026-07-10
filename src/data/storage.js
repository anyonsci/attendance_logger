const STORAGE_KEY = 'attendance-logger-people'

function readPeople() {
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

export { STORAGE_KEY, createPerson, getPersonById, readPeople, saveAttendance, updatePerson, writePeople }
