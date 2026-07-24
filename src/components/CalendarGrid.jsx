import { sameDate, formatDateKey } from '../utils/dateUtils'

export const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function getColorClassForStatus(status) {
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

export function CalendarGrid({ days, attendanceMap, onDayClick, showWeekday= true, isInteractive = true }) {
  const today = new Date()

  return (
    <div className="calendar-shell" onClick={(e) => e.stopPropagation()}>
      {showWeekday && <div className="weekday-row">
        {weekDays.map((day) => (
          <div key={day} className="weekday">
            {day}
          </div>
        ))}
      </div>}

      <div className="calendar-grid">
        {days.map(({ date, isCurrentMonth = true, isToday = sameDate(date, today) }) => {
          const dateKey = formatDateKey(date)
          const attendanceStatus = attendanceMap?.[dateKey] ?? ''
          const colorClass = getColorClassForStatus(attendanceStatus)
          const styleClass = isCurrentMonth ? '' : 'muted'
          const canClick = isInteractive && isCurrentMonth

          return (
            <button
              key={dateKey}
              type="button"
              className={`day-cell ${colorClass} ${styleClass} ${isToday ? 'today' : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                if (canClick && onDayClick) {
                  onDayClick(date)
                }
              }}
              disabled={!canClick}
              style={{ cursor: canClick ? 'pointer' : 'default' }}
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
  )
}
