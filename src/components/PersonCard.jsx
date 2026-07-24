import { useState } from 'react'
import { formatDateKey } from '../utils/dateUtils'

export function PersonCard({ person, onClick, onToggleAttendance, onDelete }) {
  const [activeRipple, setActiveRipple] = useState(null)

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

  const isAbsent = person.attendance?.[formatDateKey()] === 'Absent'
  const isPresent = person.attendance?.[formatDateKey()] === 'Present'

  return (
    <article
      className={`card card-tile ${isPresent ? 'tile-present' : ''} ${isAbsent ? 'tile-absent' : ''}`}
      role="button"
      tabIndex={0}
      onPointerDown={handlePointerDown}
      onClick={onClick}
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
          {onToggleAttendance && (
            <button
              type="button"
              className={`status-button ${isAbsent ? 'absent' : 'blank'}`}
              onClick={(event) => {
                event.stopPropagation()
                onToggleAttendance(person.id)
              }}
            >
              A
            </button>
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
      {activeRipple && (
        <span key={activeRipple.key} className="ripple" style={activeRipple.style} />
      )}
    </article>
  )
}
