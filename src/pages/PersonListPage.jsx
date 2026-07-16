import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  createPersonRemote,
  deleteAttendanceRecordRemote,
  readPeople,
  refreshPeople,
  saveAttendanceRecordRemote,
  writePeople,
} from '../data/storage'

function getTodayKey() {
  const today = new Date()
  return new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString().slice(0, 10)
}

function PersonListPage() {
  const [people, setPeople] = useState([])
  const [activeRipple, setActiveRipple] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const cachedPeople = readPeople()
    setPeople(cachedPeople)

    refreshPeople(true).then((nextPeople) => {
      setPeople(nextPeople)
    })
  }, [])

  const handleAddPerson = async () => {
    try {
      const newPerson = await createPersonRemote()
      if (newPerson?.id) {
        setPeople((current) => [newPerson, ...current.filter((person) => person.id !== newPerson.id)])
        navigate(`/people/${newPerson.id}/settings`)
      }
    } catch {
      // Keep the UI responsive even if the backend request fails.
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      const nextPeople = await refreshPeople()
      setPeople(nextPeople)
    } finally {
      setIsRefreshing(false)
    }
  }

  const toggleAttendance = async (personId) => {
    const dateKey = getTodayKey()
    const person = people.find((p) => p.id === personId)
    const currentStatus = person?.attendance?.[dateKey] || 'Present'
    const status = currentStatus === 'Present' ? 'Absent' : 'Present'

    try {
      if (status === 'Absent') {
        await saveAttendanceRecordRemote(personId, dateKey, 'Absent')
      } else {
        await deleteAttendanceRecordRemote(personId, dateKey)
      }
    } catch {
      // Keep the UI responsive even if the backend request fails.
    }

    const nextPeople = people.map((person) => {
      if (person.id !== personId) {
        return person
      }

      const nextAttendance = { ...person.attendance }
      if (status === 'Absent') {
        nextAttendance[dateKey] = status
      } else {
        delete nextAttendance[dateKey]
      }

      return {
        ...person,
        attendance: nextAttendance,
      }
    })

    setPeople(nextPeople)
    writePeople(nextPeople)
  }

  const handleRowPointerDown = (event, personId) => {
    const target = event.currentTarget
    const rect = target.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    const x = event.clientX - rect.left - size / 2
    const y = event.clientY - rect.top - size / 2

    setActiveRipple({
      personId,
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

  const handleRowClick = (personId) => {
    navigate(`/people/${personId}/calendar`)
  }

  return (
    <section className="page">
      <h2>People</h2>
      <p>Manage each person and jump to their attendance view.</p>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button type="button" onClick={handleAddPerson}>
          Add person
        </button>
        <button type="button" onClick={handleRefresh} disabled={isRefreshing}>
          {isRefreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>
      <div className="card-grid" style={{ marginTop: '1rem' }}>
        {people.map((person) => (
          <article
            key={person.id}
            className={`card card-tile ${person.attendance?.[getTodayKey()] === 'Present' ? 'tile-present' : ''} ${person.attendance?.[getTodayKey()] === 'Absent' ? 'tile-absent' : ''}`}
            role="button"
            tabIndex={0}
            onPointerDown={(event) => handleRowPointerDown(event, person.id)}
            onClick={() => handleRowClick(person.id)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                handleRowClick(person.id)
              }
            }}
          >
            <div className="card-row">
              <div>
                <h3>{person.name}</h3>
              </div>
              <div className="action-group">
                <button
                  type="button"
                  className={`status-button ${person.attendance?.[getTodayKey()] === 'Absent' ? 'absent' : 'blank'}`}
                  onClick={(event) => {
                    event.stopPropagation()
                    toggleAttendance(person.id)
                  }}
                >
                  A
                </button>
                <Link
                  to={`/people/${person.id}/settings`}
                  className="settings-icon"
                  onClick={(event) => event.stopPropagation()}
                >
                  ⚙
                </Link>
              </div>
            </div>
            {activeRipple?.personId === person.id && (
              <span key={activeRipple.key} className="ripple" style={activeRipple.style} />
            )}
          </article>
        ))}
      </div>
    </section>
  )
}

export default PersonListPage
