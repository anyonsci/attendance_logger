function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `person-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

/**
 * Creates a new person object with sensible defaults.
 * @param {Partial<Person>} overrides
 * @returns {Person}
 */
export function createPerson(overrides = {}) {
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
