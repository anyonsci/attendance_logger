import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  deleteAttendanceRecordRemote,
  readPeople,
  refreshPeople,
  saveAttendanceRecordRemote,
  writePeople,
} from '../data/storage'
import { formatDateKey } from '../utils/dateUtils'
import {
  fetchWorkspaces,
  getCachedWorkspaces,
  getWorkspaceId,
} from '../data/workspace/workspaceContext'



import { PersonCard } from '../components/PersonCard'

function PersonListPage() {
  const [people, setPeople] = useState([])

  const navigate = useNavigate()

  useEffect(() => {
    const cachedPeople = readPeople()
    setPeople(cachedPeople)

    refreshPeople(true).then((nextPeople) => {
      setPeople(nextPeople)
    })
  }, [])



  

  const toggleAttendance = async (personId) => {
    const dateKey = formatDateKey()
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

  const handleRowClick = (personId) => {
    navigate(`/people/${personId}/calendar`)
  }

  const [activeWorkspaceName, setActiveWorkspaceName] = useState('')

  useEffect(() => {
    const updateWorkspaceName = () => {
      const activeId = getWorkspaceId()
      setPeople(readPeople())
      refreshPeople(true).then((nextPeople) => {
        setPeople(nextPeople)
      })

      if (!activeId) {
        setActiveWorkspaceName('')
        return
      }
      const list = getCachedWorkspaces()
      const found = list.find((ws) => ws.id === activeId)
      if (found) {
        setActiveWorkspaceName(found.name)
      } else {
        fetchWorkspaces().then((latestList) => {
          const matched = latestList.find((ws) => ws.id === activeId)
          if (matched) setActiveWorkspaceName(matched.name)
        })
      }
    }

    updateWorkspaceName()
    window.addEventListener('workspaceChange', updateWorkspaceName)
    return () => window.removeEventListener('workspaceChange', updateWorkspaceName)
  }, [])

  let userPicture = null
  let userName = ''
  try {
    const userObj = JSON.parse(localStorage.getItem('auth_user') || '{}')
    userPicture = userObj.picture || null
    userName = userObj.name || userObj.email || 'User'
  } catch {}

  return (
    <section className="page">
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>
            {activeWorkspaceName || 'Attendance Logger'}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => navigate('/settings')}
          style={{
            width: '2.5rem',
            height: '2.5rem',
            padding: 0,
            borderRadius: '50%',
            overflow: 'hidden',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            background: '#2563eb',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '1rem',
          }}
          title={userName}
        >
          {userPicture ? (
            <img src={userPicture} alt={userName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            userName.charAt(0).toUpperCase() || 'U'
          )}
        </button>
      </header>
      
      <div className="card-grid" style={{ marginTop: '1rem' }}>
        {people.map((person) => (
          <PersonCard
            key={person.id}
            person={person}
            onClick={() => handleRowClick(person.id)}
            onToggleAttendance={toggleAttendance}
          />
        ))}
      </div>
    </section>
  )
}

export default PersonListPage
