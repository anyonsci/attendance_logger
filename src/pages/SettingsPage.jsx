import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  createWorkspace,
  fetchWorkspaces,
  getCachedWorkspaces,
  getWorkspaceId,
  setWorkspaceId,
} from '../data/workspace/workspaceContext'
import { createPersonRemote, deletePersonRemote, readPeopleFromCache, refreshPeople } from '../data/storage'
import { PersonCard } from '../components/PersonCard'
import ConfirmModal from '../components/ConfirmModal'

function SettingsPage() {
  const navigate = useNavigate()
  const [workspaces, setWorkspaces] = useState([])
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(getWorkspaceId() || '')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [people, setPeople] = useState([])
  const [addingPerson, setAddingPerson] = useState(false)
  const [deletingPerson, setDeletingPerson] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Create Workspace Form state
  const [isCreating, setIsCreating] = useState(false)
  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState('')

  useEffect(() => {
    setWorkspaces(getCachedWorkspaces())
    setLoading(true)
    fetchWorkspaces().then((list) => {
      setWorkspaces(list)
      setLoading(false)
    })

    setPeople(readPeopleFromCache())
    refreshPeople().then((list) => {
      setPeople(list)
    })
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      const nextPeople = await refreshPeople()
      setPeople(nextPeople)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleSelectWorkspace = (e) => {
    const val = e.target.value
    setSelectedWorkspaceId(val)
    setWorkspaceId(val)
    refreshPeople().then((list) => {
      setPeople(list)
    })
  }

  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    if (!newWorkspaceName.trim()) return

    setCreateLoading(true)
    setCreateError('')
    try {
      const created = await createWorkspace(newWorkspaceName.trim())
      const updatedList = await fetchWorkspaces()
      setWorkspaces(updatedList)
      if (created?.id) {
        setSelectedWorkspaceId(created.id)
        setWorkspaceId(created.id)
        refreshPeople().then((list) => {
          setPeople(list)
        })
      }
      setNewWorkspaceName('')
      setIsCreating(false)
    } catch (err) {
      console.error('Failed to create workspace', err)
      setCreateError(err.response?.data?.error || 'Failed to create workspace')
    } finally {
      setCreateLoading(false)
    }
  }

  const handleAddPerson = async () => {
    setAddingPerson(true)
    try {
      const newPerson = await createPersonRemote()
      if (newPerson?.id) {
        setPeople((current) => [newPerson, ...current.filter((p) => p.id !== newPerson.id)])
        navigate(`/people/${newPerson.id}/settings`)
      }
    } catch {
      // Keep UI responsive even if request fails
    } finally {
      setAddingPerson(false)
    }
  }

  const handleDeletePersonClick = (person) => {
    setDeletingPerson(person)
  }

  const handleConfirmDeletePerson = async () => {
    if (!deletingPerson) return
    setIsDeleting(true)
    try {
      await deletePersonRemote(deletingPerson.id)
      setPeople((current) => current.filter((p) => p.id !== deletingPerson.id))
      setDeletingPerson(null)
    } catch {
      // Keep UI responsive
    } finally {
      setIsDeleting(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    navigate('/signin', { replace: true })
  }

  return (
    <section className="page" style={{ display: 'flex', flexDirection: 'column', minHeight: '80vh' }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <button
            type="button"
            className="ghost-button"
            onClick={() => navigate(-1)}
            style={{ width: 'auto', padding: '0.5rem 1rem' }}
          >
            ← Back
          </button>
          <h2 style={{ margin: 0 }}>Settings</h2>
        </div>

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ margin: 0 }}>Workspace Selection</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '0.25rem 0 0 0' }}>
                Select an active workspace to filter people and attendance logs.
              </p>
            </div>
            {!isCreating && (
              <button
                type="button"
                onClick={() => setIsCreating(true)}
                style={{ width: 'auto', padding: '0.5rem 0.9rem', fontSize: '0.85rem' }}
              >
                + Create Workspace
              </button>
            )}
          </div>

          {isCreating ? (
            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'rgba(15, 23, 42, 0.6)', padding: '1rem', borderRadius: '10px' }}>
              <h4 style={{ margin: 0 }}>Create New Workspace</h4>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <span>Workspace Name</span>
                <input
                  type="text"
                  placeholder="e.g. Engineering Team"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  required
                  autoFocus
                />
              </label>
              {createError && <p style={{ color: '#ef4444', margin: 0, fontSize: '0.85rem' }}>{createError}</p>}
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => {
                    setIsCreating(false)
                    setNewWorkspaceName('')
                    setCreateError('')
                  }}
                  disabled={createLoading}
                  style={{ width: 'auto', padding: '0.5rem 0.8rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading || !newWorkspaceName.trim()}
                  style={{ width: 'auto', padding: '0.5rem 1rem' }}
                >
                  {createLoading ? 'Creating…' : 'Create'}
                </button>
              </div>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span>Workspace</span>
              <select
                value={selectedWorkspaceId}
                onChange={handleSelectWorkspace}
                disabled={loading && workspaces.length === 0}
                style={{
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(148, 163, 184, 0.35)',
                  background: 'rgba(15, 23, 42, 0.8)',
                  color: '#f8fafc',
                }}
              >
                <option value="">-- Select a Workspace --</option>
                {workspaces.map((ws) => (
                  <option key={ws.id || ws._id} value={ws.id}>
                    {ws.name} ({ws.id})
                  </option>
                ))}
              </select>
              <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '1 rem' }}>
                <button type="button" onClick={handleRefresh} disabled={isRefreshing}>
                  {isRefreshing ? 'Refreshing…' : 'Refresh workspace'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ margin: 0 }}>People</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '0.25rem 0 0 0' }}>
                Manage people in this workspace or click on any person to edit their settings.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddPerson}
              disabled={addingPerson}
              style={{ width: 'auto', padding: '0.5rem 0.9rem', fontSize: '0.85rem' }}
            >
              {addingPerson ? 'Adding…' : '+ Add Person'}
            </button>
          </div>

          {people.length === 0 ? (
            <p style={{ color: '#64748b', fontStyle: 'italic', margin: 0 }}>
              No people found for this workspace.
            </p>
          ) : (
            <div className="card-grid">
              {people.map((person) => (
                <PersonCard
                  key={person.id}
                  person={person}
                  onClick={() => navigate(`/people/${person.id}/settings`)}
                  onDelete={handleDeletePersonClick}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <footer style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(148, 163, 184, 0.15)', display: 'flex', justifyContent: 'center' }}>
        <button
          type="button"
          onClick={handleLogout}
          style={{
            background: 'rgba(220, 38, 38, 0.15)',
            color: '#fca5a5',
            border: '1px solid rgba(220, 38, 38, 0.3)',
          }}
        >
          Logout
        </button>
      </footer>

      <ConfirmModal
        isOpen={Boolean(deletingPerson)}
        title="Delete Person"
        message={`Are you sure you want to delete ${deletingPerson?.name}? This will remove all their attendance data.`}
        confirmText="Delete Person"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDeletePerson}
        onCancel={() => setDeletingPerson(null)}
      />
    </section>
  )
}

export default SettingsPage
