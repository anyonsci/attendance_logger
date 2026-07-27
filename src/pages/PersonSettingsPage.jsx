import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { deletePersonRemote, getPersonById, readPeople, refreshPeople, updatePersonRemote } from '../data/storage'
import ConfirmModal from '../components/ConfirmModal'

function PersonSettingsPage() {
  const { personId } = useParams()
  const [person, setPerson] = useState(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const cachedPeople = readPeople()
    const cachedPerson = getPersonById(cachedPeople, personId)

    if (cachedPerson) {
      setPerson(cachedPerson)
      return
    }

    refreshPeople().then((nextPeople) => {
      setPerson(getPersonById(nextPeople, personId))
    })
  }, [personId])

  const handleChange = (field, value) => {
    setPerson((current) => (current ? { ...current, [field]: value } : current))
  }

  const handleSave = async () => {
    if (!person) {
      return
    }

    try {
      const updatedPerson = await updatePersonRemote(person.id, person)
      setPerson(updatedPerson || { ...person })
      navigate(-1)
    } catch {
      // Keep the UI responsive even if the backend request fails.
    }
  }

  const handleCancel = () => {
    navigate(-1)
  }

  const handleDeleteClick = () => {
    if (!person) return
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!person) return

    setIsDeleting(true)
    try {
      await deletePersonRemote(person.id)
      setIsDeleteModalOpen(false)
      navigate(-1)
    } catch {
      // Keep the UI responsive even if the backend request fails.
    } finally {
      setIsDeleting(false)
    }
  }

  if (!person) {
    return (
      <section className="page">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <button type="button" className="ghost-button" onClick={() => navigate(-1)} style={{ width: 'auto', padding: '0.5rem 1rem' }}>
            ← Back
          </button>
          <h2 style={{ margin: 0 }}>Edit Person</h2>
        </div>
        <p style={{ color: '#64748b' }}>No person found.</p>
      </section>
    )
  }

  return (
    <section className="page">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button type="button" className="ghost-button" onClick={() => navigate(-1)} style={{ width: 'auto', padding: '0.5rem 1rem' }}>
          ← Back
        </button>
        <h2 style={{ margin: 0 }}>Edit Person</h2>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <h3 style={{ margin: '0 0 0.25rem 0' }}>Person Details</h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>ID: {person.id}</p>
        </div>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <span>Name</span>
          <input
            type="text"
            value={person.name}
            onChange={(event) => handleChange('name', event.target.value)}
            placeholder="Enter name"
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <span>Salary</span>
          <input
            type="number"
            value={person.salary}
            onChange={(event) => handleChange('salary', event.target.value)}
            placeholder="Enter salary"
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <span>Allowed leaves per month</span>
          <input
            type="number"
            value={person.allowedLeavesPerMonth}
            onChange={(event) => handleChange('allowedLeavesPerMonth', event.target.value)}
            placeholder="e.g. 4"
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <span>Report time</span>
          <input
            type="time"
            step="60"
            value={person.reportTime}
            onChange={(event) => handleChange('reportTime', event.target.value)}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <span>Duration</span>
          <input
            type="number"
            value={person.duration}
            onChange={(event) => handleChange('duration', event.target.value)}
            placeholder="e.g. 8"
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <span>Duration unit</span>
          <select
            value={person.durationUnit}
            onChange={(event) => handleChange('durationUnit', event.target.value)}
          >
            <option value="minute">Minute</option>
            <option value="hour">Hour</option>
          </select>
        </label>

        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button
            type="button"
            onClick={handleDeleteClick}
            style={{
              width: 'auto',
              padding: '0.5rem 1rem',
              background: 'rgba(220, 38, 38, 0.15)',
              color: '#fca5a5',
              border: '1px solid rgba(220, 38, 38, 0.3)',
              marginRight: 'auto',
            }}
          >
            Delete Person
          </button>
          <button type="button" className="ghost-button" onClick={handleCancel} style={{ width: 'auto' }}>
            Cancel
          </button>
          <button type="button" onClick={handleSave} style={{ width: 'auto', padding: '0.5rem 1.2rem' }}>
            Save Changes
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete Person"
        message={`Are you sure you want to delete ${person.name}? This will remove all their attendance data.`}
        confirmText="Delete Person"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </section>
  )
}

export default PersonSettingsPage
