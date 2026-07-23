import api from '../../api/client'
import { assertPermission } from '../permissions/permissions'
import { cacheRead, cacheWrite } from '../cache/localStorageCache'
import { CACHE_KEYS } from '../cache/cacheKeys'
import { readNotesFromCache, writeNotesToCache } from './notesCache'

export async function getNotesRemote(personId = '') {
  assertPermission('notes', 'read')
  try {
    const response = await api.get('/notes', {
      params: personId ? { personId } : {},
    })
    const loadedNotes = Array.isArray(response?.data) ? response.data : []
    writeNotesToCache(personId, loadedNotes)
    return loadedNotes
  } catch (error) {
    console.error('Failed to load notes from backend.', error)
    return readNotesFromCache(personId)
  }
}

export async function saveNoteRemote(noteData) {
  const isEdit = Boolean(noteData.id || noteData._id)
  assertPermission('notes', isEdit ? 'edit' : 'create')

  try {
    const noteId = noteData.id || noteData._id
    const response = isEdit
      ? await api.put('/notes', { ...noteData, id: noteId })
      : await api.post('/notes', noteData)

    const savedNote = response?.data || null
    if (savedNote) {
      const personIdKey = savedNote.personId || noteData.personId || ''
      const cached = readNotesFromCache(personIdKey)
      const targetId = savedNote._id || savedNote.id || noteId
      const index = cached.findIndex((n) => (n._id || n.id) === targetId)
      const updated = index >= 0
        ? cached.map((n, i) => (i === index ? savedNote : n))
        : [savedNote, ...cached]
      writeNotesToCache(personIdKey, updated)
    }

    return savedNote
  } catch (error) {
    console.error('Failed to save note on backend.', error)
    throw error
  }
}

export async function deleteNoteRemote(noteId, personId = '') {
  assertPermission('notes', 'delete')

  try {
    const response = await api.delete('/notes', { data: { id: noteId } })

    if (personId) {
      const cached = readNotesFromCache(personId)
      writeNotesToCache(personId, cached.filter((n) => (n._id || n.id) !== noteId))
    } else {
      // Sweep the entire notes cache
      const fullCache = cacheRead(CACHE_KEYS.NOTES, {})
      for (const key in fullCache) {
        if (Array.isArray(fullCache[key])) {
          fullCache[key] = fullCache[key].filter((n) => (n._id || n.id) !== noteId)
        }
      }
      cacheWrite(CACHE_KEYS.NOTES, fullCache)
    }

    return response?.data || null
  } catch (error) {
    if (error?.response?.status === 404) {
      if (personId) {
        const cached = readNotesFromCache(personId)
        writeNotesToCache(personId, cached.filter((n) => (n._id || n.id) !== noteId))
      }
      return { success: true }
    }
    console.error('Failed to delete note on backend.', error)
    throw error
  }
}
