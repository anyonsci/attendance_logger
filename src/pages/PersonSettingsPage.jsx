import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getPersonById, readPeople, updatePerson, writePeople } from '../data/storage'

function PersonSettingsPage() {
  const { personId } = useParams()
  const [person, setPerson] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const people = readPeople()
    setPerson(getPersonById(people, personId))
  }, [personId])

  const handleChange = (field, value) => {
    setPerson((current) => (current ? { ...current, [field]: value } : current))
  }

  const handleSave = () => {
    if (!person) {
      return
    }

    const people = readPeople()
    const nextPeople = updatePerson(people, person.id, person)
    writePeople(nextPeople)
    setPerson({ ...person })
    navigate('/people')
  }

  const handleDelete = () => {
    if (!person) return

    const ok = window.confirm(`Delete ${person.name}? This will remove all their attendance data.`)
    if (!ok) return

    const people = readPeople()
    const nextPeople = people.filter((p) => p.id !== person.id)
    writePeople(nextPeople)
    navigate('/people')
  }

  if (!person) {
    return (
      <section className="page">
        <h2>Person settings</h2>
        <p>No person found.</p>
      </section>
    )
  }

  return (
    <section className="page">
      <h2>Person settings</h2>
      <p>Editing settings for {person.name}.</p>

      <div className="card">
        <label>
          <span>Name</span>
          <input
            type="text"
            value={person.name}
            onChange={(event) => handleChange('name', event.target.value)}
            placeholder="Enter name"
          />
        </label>

        <label>
          <span>Salary</span>
          <input
            type="number"
            value={person.salary}
            onChange={(event) => handleChange('salary', event.target.value)}
            placeholder="Enter salary"
          />
        </label>

        <label>
          <span>Allowed leaves per month</span>
          <input
            type="number"
            value={person.allowedLeavesPerMonth}
            onChange={(event) => handleChange('allowedLeavesPerMonth', event.target.value)}
            placeholder="e.g. 4"
          />
        </label>

        <label>
          <span>Report time</span>
          <input
            type="time"
            step="60"
            value={person.reportTime}
            onChange={(event) => handleChange('reportTime', event.target.value)}
          />
        </label>

        <label>
          <span>Duration</span>
          <input
            type="number"
            value={person.duration}
            onChange={(event) => handleChange('duration', event.target.value)}
            placeholder="e.g. 8"
          />
        </label>

        <label>
          <span>Duration unit</span>
          <select
            value={person.durationUnit}
            onChange={(event) => handleChange('durationUnit', event.target.value)}
          >
            <option value="minute">Minute</option>
            <option value="hour">Hour</option>
          </select>
        </label>

        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
          <button type="button" onClick={handleSave}>
            Save settings
          </button>

          <button
            type="button"
            onClick={handleDelete}
            style={{ background: '#e53935', color: 'white' }}
          >
            Delete person
          </button>
        </div>
      </div>
    </section>
  )
}

export default PersonSettingsPage
