import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  deleteAttendanceRecordRemote,
  getPersonById,
  readPeople,
  saveAttendanceRecordRemote,
  writePeople,
} from '../data/storage'
import NotesPage from './NotesPage'
import { formatDateKey, formatMonthKey } from '../utils/dateUtils'

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function getMonthWorkingDays(date) {
  const year = date.getFullYear()
  const month = date.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  let workingDays = 0

  for (let day = 1; day <= daysInMonth; day += 1) {
    const current = new Date(year, month, day)
    const weekday = current.getDay()
    workingDays += 1
  }
  return workingDays
}

function estimateSalary(person, viewDate) {
  const monthlySalary = Number(person?.salary || 0)
  const allowedLeaves = Number(person?.allowedLeavesPerMonth || 0)
  const workingDays = getMonthWorkingDays(viewDate)
  const attendance = person?.attendance || {}
  const monthPrefix = formatMonthKey(viewDate)

  let absentDays = 0
  Object.keys(attendance).forEach((key) => {
    if (key.startsWith(monthPrefix) && attendance[key] === 'Absent') {
      const date = new Date(key)
      const weekday = date.getDay()
      absentDays += 1
    }
  })

  const unpaidAbsentDays = Math.max(0, absentDays - allowedLeaves)
  const payableDays = Math.max(0, workingDays - unpaidAbsentDays)
  const salary = workingDays > 0 ? Math.round((monthlySalary * payableDays) / workingDays) : 0

  return {
    monthlySalary,
    allowedLeaves,
    workingDays,
    absentDays,
    unpaidAbsentDays,
    payableDays,
    estimate: salary,
  }
}

function sameDate(left, right) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  )
}

function buildCalendarDays(viewDate) {
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startOffset = firstDay.getDay()
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7
  const today = new Date()

  return Array.from({ length: totalCells }, (_, index) => {
    const date = new Date(year, month, index - startOffset + 1)
    const isCurrentMonth = date.getMonth() === month
    const isToday = sameDate(date, today)

    return { date, isCurrentMonth, isToday }
  })
}

function getColorClassForStatus(status) {
  switch (status) {
    case 'Present':
      return ''
    case 'Absent':
      return 'color-red'
    case 'Late':
      return 'color-yellow'
    default:
      return ''
  }
}



function areAttendancesEqual(left, right) {
  const leftKeys = Object.keys(left || {})
  const rightKeys = Object.keys(right || {})

  if (leftKeys.length !== rightKeys.length) {
    return false
  }

  return leftKeys.every((key) => left[key] === right[key])
}

function AttendanceCalendarPage() {
  const { personId } = useParams()
  const [viewDate, setViewDate] = useState(new Date())
  const [person, setPerson] = useState(null)
  const [draftAttendance, setDraftAttendance] = useState({})
  const [isSaving, setIsSaving] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const cachedPeople = readPeople()
    const cachedPerson = getPersonById(cachedPeople, personId)
    const initialAttendance = cachedPerson?.attendance || {}

    setPerson(cachedPerson)
    setDraftAttendance(initialAttendance)
  }, [personId])

  const calendarDays = useMemo(() => buildCalendarDays(viewDate), [viewDate])
  const draftPerson = useMemo(
    () => ({ ...(person || {}), attendance: draftAttendance }),
    [person, draftAttendance]
  )
  const salaryEstimate = useMemo(() => estimateSalary(draftPerson, viewDate), [draftPerson, viewDate])
  const isDirty = useMemo(
    () => !areAttendancesEqual(draftAttendance, person?.attendance || {}),
    [draftAttendance, person]
  )

  const goToPreviousMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))
  }

  const handleDayClick = (date) => {
    if (!person) {
      return
    }

    const dateKey = formatDateKey(date)
    const nextStatus = draftAttendance[dateKey] === 'Absent' ? '' : 'Absent'

    setDraftAttendance((current) => {
      const nextDraft = { ...current }

      if (nextStatus) {
        nextDraft[dateKey] = nextStatus
      } else {
        delete nextDraft[dateKey]
      }

      return nextDraft
    })
  }

  const handleSave = async () => {
    if (!person || !isDirty) {
      return
    }

    setIsSaving(true)

    try {
      const previousAttendance = person?.attendance || {}
      const pendingPromises = []

      Object.entries(previousAttendance).forEach(([dateKey, status]) => {
        if (status === 'Absent' && !draftAttendance[dateKey]) {
          pendingPromises.push(deleteAttendanceRecordRemote(person.id, dateKey))
        }
      })

      Object.entries(draftAttendance).forEach(([dateKey, status]) => {
        if (status === 'Absent' && previousAttendance[dateKey] !== status) {
          pendingPromises.push(saveAttendanceRecordRemote(person.id, dateKey, status))
        }
      })

      await Promise.all(pendingPromises)

      const nextPeople = readPeople().map((entry) => {
        if (entry.id !== person.id) {
          return entry
        }

        return {
          ...entry,
          attendance: draftAttendance,
        }
      })

      writePeople(nextPeople)
      setPerson({ ...person, attendance: draftAttendance })
      setDraftAttendance({ ...draftAttendance })
      navigate(`/people`)
    } catch {
      // Keep the UI responsive even if the backend request fails.
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setDraftAttendance(person?.attendance || {})
    navigate(`/people`)
  }

  return (
    <section className="page">
      <h2>{person?.name ?? ''} ({salaryEstimate.monthlySalary || 0})</h2>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button type="button" onClick={handleSave} disabled={!isDirty || isSaving}>
          {isSaving ? 'Saving…' : 'Save'}
        </button>
        <button type="button" className="ghost-button" onClick={handleCancel}>
          Cancel
        </button>
      </div>
      <div className="salary-summary card">
        <div className="salary-row">
          <span>Working days</span>
          <strong>{salaryEstimate.workingDays}</strong>
        </div>
        <div className="salary-row">
          <span>Absent days</span>
          <strong>{salaryEstimate.absentDays}</strong>
        </div>
        <div className="salary-row">
          <span>Payable days</span>
          <strong>{salaryEstimate.payableDays}</strong>
        </div>
        <div className="salary-row total">
          <span>Estimated payout</span>
          <strong>{salaryEstimate.estimate}</strong>
        </div>
      </div>

      <div className="calendar-shell">
        <div className="calendar-header">
          <button type="button" className="ghost-button" onClick={goToPreviousMonth}>
            Prev
          </button>
          <h3>
            {viewDate.toLocaleDateString('en', { month: 'long', year: 'numeric' })}
          </h3>
          <button type="button" className="ghost-button" onClick={goToNextMonth}>
            Next
          </button>
        </div>

        <div className="weekday-row">
          {weekDays.map((day) => (
            <div key={day} className="weekday">
              {day}
            </div>
          ))}
        </div>

        <div className="calendar-grid">
          {calendarDays.map(({ date, isCurrentMonth, isToday }) => {
            const dateKey = formatDateKey(date)
            const attendanceStatus = draftAttendance[dateKey] ?? ''
            const colorClass = getColorClassForStatus(attendanceStatus)
            const styleClass = isCurrentMonth ? '' : 'muted'
            return (
              <button
                key={`${dateKey}`}
                type="button"
                className={`day-cell ${colorClass} ${styleClass} ${isToday ? 'today' : ''}`}
                onClick={() => isCurrentMonth && handleDayClick(date)}
                disabled={!isCurrentMonth}
              >
                <span className="day-number">{date.getDate()}</span>
                {isCurrentMonth && attendanceStatus == "Absent" && (
                  <span className="day-status">{attendanceStatus[0]}</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <NotesPage personId={personId} month={formatMonthKey(viewDate)} />
      </div>
    </section>
  )
}

export default AttendanceCalendarPage
