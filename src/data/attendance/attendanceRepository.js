import api from '../../api/client'
import { assertPermission } from '../permissions/permissions'

export async function getAttendanceRecordsRemote(personId = '') {
  assertPermission('attendance', 'read')
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

export async function saveAttendanceRecordRemote(personId, dateKey, status) {
  assertPermission('attendance', 'edit')
  if (!personId || !dateKey || status !== 'Absent') return null
  try {
    const response = await api.put('/attendance', { personId, dateKey, status })
    return response?.data || null
  } catch (error) {
    console.error('Failed to save attendance record on backend.', error)
    throw error
  }
}

export async function deleteAttendanceRecordRemote(personId, dateKey) {
  assertPermission('attendance', 'delete')
  try {
    const response = await api.delete('/attendance', { data: { personId, dateKey } })
    return response?.data || null
  } catch (error) {
    if (error?.response?.status === 404) return { success: true }
    console.error('Failed to delete attendance record on backend.', error)
    throw error
  }
}

/** Pure helper — updates attendance in a local people list without any I/O. */
export function saveAttendanceLocally(people, personId, dateKey, status) {
  return people.map((person) => {
    if (person.id !== personId) return person
    return {
      ...person,
      attendance: { ...person.attendance, [dateKey]: status },
    }
  })
}
