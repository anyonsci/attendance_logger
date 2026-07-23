// Backward-compatible barrel re-export.
// Prefer importing directly from the domain modules for new code.

export { CACHE_KEYS } from './cache/cacheKeys'

// Legacy key aliases kept for backward compatibility
export { CACHE_KEYS as STORAGE_KEY, CACHE_KEYS as NOTES_STORAGE_KEY } from './cache/cacheKeys'

export { createPerson } from './people/peopleFactory'

export {
  readPeopleFromCache,
  readPeopleFromCache as readPeople,
  writePeople,
  getPersonById,
  updatePersonInList as updatePerson,
} from './people/peopleCache'

export {
  refreshPeople,
  createPersonRemote,
  updatePersonRemote,
  deletePersonRemote,
} from './people/peopleRepository'

export {
  getAttendanceRecordsRemote,
  saveAttendanceRecordRemote,
  deleteAttendanceRecordRemote,
  saveAttendanceLocally as saveAttendance,
} from './attendance/attendanceRepository'

export { readNotesFromCache, writeNotesToCache } from './notes/notesCache'

export { getNotesRemote, saveNoteRemote, deleteNoteRemote } from './notes/notesRepository'
