import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { formatDateKey, getCurrentWeekDays } from '../utils/dateUtils'
import { CalendarGrid } from './CalendarGrid'
import {
  deleteAttendanceRecordRemote,
  readPeople,
  saveAttendanceRecordRemote,
  writePeople,
} from '../data/storage'

function areAttendancesEqual(left, right) {
  const leftKeys = Object.keys(left || {})
  const rightKeys = Object.keys(right || {})

  if (leftKeys.length !== rightKeys.length) {
    return false
  }

  return leftKeys.every((key) => left[key] === right[key])
}

export function PersonCard({ person, onClick, onDelete, onAttendanceChange, showCurrentWeek = true }) {
  const [activeRipple, setActiveRipple] = useState(null)
  const [draftAttendance, setDraftAttendance] = useState(person?.attendance || {})
  const [isSaving, setIsSaving] = useState(false)

  // Sync draftAttendance if person prop updates externally (e.g. from parent re-fetch) when not dirty
  const isDirty = useMemo(
    () => !areAttendancesEqual(draftAttendance, person?.attendance || {}),
    [draftAttendance, person]
  )

  useEffect(() => {
    setDraftAttendance(person?.attendance || {})
  }, [person?.attendance])

  const handlePointerDown = (event) => {
    const target = event.currentTarget
    const rect = target.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    const x = event.clientX - rect.left - size / 2
    const y = event.clientY - rect.top - size / 2

    setActiveRipple({
      style: {
        width: size,
        height: size,
        left: x,
        top: y,
      },
      key: Date.now(),
    })

    setTimeout(() => setActiveRipple(null), 450)
  }

  // Ref to track latest draftAttendance & person for save operation
  const stateRef = useRef({ person, draftAttendance, isDirty })
  useEffect(() => {
    stateRef.current = { person, draftAttendance, isDirty }
  }, [person, draftAttendance, isDirty])

  const performSave = useCallback(async () => {
    const { person: currentPerson, draftAttendance: currentDraft, isDirty: dirty } = stateRef.current
    if (!currentPerson || !dirty) return

    setIsSaving(true)
    try {
      const previousAttendance = currentPerson?.attendance || {}
      const pendingPromises = []

      Object.entries(previousAttendance).forEach(([dateKey, status]) => {
        if (status && !currentDraft[dateKey]) {
          pendingPromises.push(deleteAttendanceRecordRemote(currentPerson.id, dateKey))
        }
      })

      Object.entries(currentDraft).forEach(([dateKey, status]) => {
        if (status && previousAttendance[dateKey] !== status) {
          pendingPromises.push(saveAttendanceRecordRemote(currentPerson.id, dateKey, status))
        }
      })

      await Promise.all(pendingPromises)

      const nextPeople = readPeople().map((entry) => {
        if (entry.id !== currentPerson.id) {
          return entry
        }
        return {
          ...entry,
          attendance: currentDraft,
        }
      })

      writePeople(nextPeople)
      if (onAttendanceChange) {
        onAttendanceChange(currentPerson.id, currentDraft)
      }
    } catch {
      // Keep UI responsive
    } finally {
      setIsSaving(false)
    }
  }, [onAttendanceChange])

  const performSaveRef = useRef(performSave)
  useEffect(() => {
    performSaveRef.current = performSave
  }, [performSave])

  // 5-second debounce auto-save
  useEffect(() => {
    if (!isDirty) return

    const timer = setTimeout(() => {
      performSaveRef.current()
    }, 3000)

    return () => {
      clearTimeout(timer)
    }
  }, [draftAttendance, isDirty])

  // Save on unmount (navigation to another page, e.g. Settings)
  useEffect(() => {
    return () => {
      if (stateRef.current.isDirty) {
        performSaveRef.current()
      }
    }
  }, [])

  const defaultStatus = person.defaultAttendance || 'Present'
  const handleDayClick = (date) => {
    if (!person) return

    const dateKey = formatDateKey(date)
    const currentStatus = draftAttendance[dateKey] || defaultStatus
    const nextStatus = currentStatus === 'Absent' ? 'Present' : 'Absent'

    setDraftAttendance((current) => {
      const nextDraft = { ...current }
      if (nextStatus === defaultStatus) {
        delete nextDraft[dateKey]
      } else {
        nextDraft[dateKey] = nextStatus
      }
      return nextDraft
    })
  }

  const weekDaysList = useMemo(() => {
    const days = getCurrentWeekDays(new Date())
    return days.map((date) => ({
      date,
      isCurrentMonth: true,
    }))
  }, [])

  const todayKey = formatDateKey()
  const todayStatus = draftAttendance[todayKey] || '';
  const isAbsentToday = todayStatus === 'Absent'
  const isPresentToday = todayStatus === 'Present'

  return (
    <article
      className={`card card-tile ${isPresentToday ? 'tile-present' : ''} ${isAbsentToday ? 'tile-absent' : ''}`}
      role="button"
      tabIndex={0}
      onPointerDown={handlePointerDown}
      onClick={async (e) => {
        if (onClick) {
          onClick(e)
        }
      }}
      onKeyDown={(event) => {
        if ((event.key === 'Enter' || event.key === ' ') && onClick) {
          onClick()
        }
      }}
    >
      <div className="card-row">
        <div>
          <h3>{person.name}</h3>
        </div>
        <div className="action-group">
          {isSaving && (
            <span style={{ fontSize: '0.8rem', color: '#60a5fa', fontStyle: 'italic', marginRight: '0.5rem' }}>
              Saving…
            </span>
          )}
          {onDelete && (
            <button
              type="button"
              className="delete-button"
              onClick={(event) => {
                event.stopPropagation()
                onDelete(person)
              }}
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {showCurrentWeek && (
        <div style={{ marginTop: '0.75rem' }}>
          <CalendarGrid
            days={weekDaysList}
            attendanceMap={draftAttendance}
            defaultAttendance={person?.defaultAttendance || 'Present'}
            onDayClick={handleDayClick}
            showWeekday={false}
        />
      </div>)}

      {activeRipple && (
        <span key={activeRipple.key} className="ripple" style={activeRipple.style} />
      )}
    </article>
  )
}
