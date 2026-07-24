import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
  const [showPayoutModal, setShowPayoutModal] = useState(false)
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
        if (status === 'Absent' && !currentDraft[dateKey]) {
          pendingPromises.push(deleteAttendanceRecordRemote(currentPerson.id, dateKey))
        }
      })

      Object.entries(currentDraft).forEach(([dateKey, status]) => {
        if (status === 'Absent' && previousAttendance[dateKey] !== status) {
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
      setPerson({ ...currentPerson, attendance: currentDraft })
    } catch {
      // Keep UI responsive
    } finally {
      setIsSaving(false)
    }
  }, [])

  // 5-second debounce auto-save
  useEffect(() => {
    if (!isDirty) return

    const timer = setTimeout(() => {
      performSave()
    }, 5000)

    return () => clearTimeout(timer)
  }, [draftAttendance, isDirty, performSave])

  const handleBack = async () => {
    if (isDirty) {
      await performSave()
    }
    navigate(-1)
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

  return (
    <section className="page">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            type="button"
            className="ghost-button"
            onClick={handleBack}
            style={{ width: 'auto', padding: '0.5rem 1rem' }}
          >
            ← Back
          </button>
          <h2 style={{ margin: 0 }}>{person?.name ?? ''}</h2>
        </div>
        {isSaving && (
          <span style={{ fontSize: '0.85rem', color: '#60a5fa', fontStyle: 'italic' }}>Saving…</span>
        )}
      </div>

      <div
        className="salary-summary card"
        onClick={() => setShowPayoutModal(true)}
        style={{ cursor: 'pointer', marginBottom: '1rem' }}
      >
        <div className="salary-row total" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
          <span>Estimated payout</span>
          <strong>{salaryEstimate.estimate}</strong>
        </div>
      </div>

      {showPayoutModal && (
        <div className="modal-backdrop" onClick={() => setShowPayoutModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setShowPayoutModal(false)}
            >
              ✕
            </button>
            <h3 className="modal-title" style={{ marginBottom: '1rem' }}>Salary Payout Breakdown</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="salary-row">
                <span>Monthly Base Salary</span>
                <strong>{salaryEstimate.monthlySalary}</strong>
              </div>
              <div className="salary-row">
                <span>Working Days in Month</span>
                <strong>{salaryEstimate.workingDays}</strong>
              </div>
              <div className="salary-row">
                <span>Absent Days</span>
                <strong>{salaryEstimate.absentDays}</strong>
              </div>
              <div className="salary-row">
                <span>Allowed Paid Leaves</span>
                <strong>{salaryEstimate.allowedLeaves}</strong>
              </div>
              <div className="salary-row">
                <span>Unpaid Absent Days</span>
                <strong>{salaryEstimate.unpaidAbsentDays}</strong>
              </div>
              <div className="salary-row">
                <span>Payable Days</span>
                <strong>{salaryEstimate.payableDays}</strong>
              </div>
              <div className="salary-row total" style={{ marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(148, 163, 184, 0.2)' }}>
                <span>Estimated Payout</span>
                <strong>{salaryEstimate.estimate}</strong>
              </div>
            </div>
            <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="modal-btn modal-btn-cancel"
                onClick={() => setShowPayoutModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
                style={{ cursor: isCurrentMonth ? 'pointer' : 'default' }}
              >
                <span className="day-number">{date.getDate()}</span>
                {isCurrentMonth && attendanceStatus === 'Absent' && (
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
