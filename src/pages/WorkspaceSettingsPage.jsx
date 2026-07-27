import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  fetchWorkspaces,
  getCachedWorkspaces,
  getWorkspaceId,
  updateWorkspace,
} from '../data/workspace/workspaceContext'
import { showToast } from '../components/Toast'

function WorkspaceSettingsPage() {
  const navigate = useNavigate()
  const [workspace, setWorkspace] = useState(null)
  const [workspaceName, setWorkspaceName] = useState('')
  const [readAccessEmails, setReadAccessEmails] = useState([])
  const [writeAccessEmails, setWriteAccessEmails] = useState([])

  const [newReadEmail, setNewReadEmail] = useState('')
  const [newWriteEmail, setNewWriteEmail] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  let currentUserEmail = ''
  try {
    const userObj = JSON.parse(localStorage.getItem('auth_user') || '{}')
    currentUserEmail = (userObj.email || '').trim().toLowerCase()
  } catch {}

  const activeId = getWorkspaceId()

  useEffect(() => {
    const loadWorkspace = async () => {
      setLoading(true)
      const list = await fetchWorkspaces()
      const found = list.find((w) => w.id === activeId)
      if (found) {
        setWorkspace(found)
        setWorkspaceName(found.name || '')
        setReadAccessEmails(Array.isArray(found.readAccessEmails) ? found.readAccessEmails : [])
        setWriteAccessEmails(Array.isArray(found.writeAccessEmails) ? found.writeAccessEmails : [])
      }
      setLoading(false)
    }

    loadWorkspace()
  }, [activeId])

  const isOwner = Boolean(
    workspace &&
    workspace.ownerEmail &&
    currentUserEmail &&
    workspace.ownerEmail.trim().toLowerCase() === currentUserEmail
  )

  const handleAddReadEmail = () => {
    const email = newReadEmail.trim().toLowerCase()
    if (!email) return
    if (readAccessEmails.map((e) => e.toLowerCase()).includes(email)) {
      showToast(`${email} is already in read access list`, 'error')
      return
    }
    setReadAccessEmails([...readAccessEmails, email])
    setNewReadEmail('')
  }

  const handleRemoveReadEmail = (emailToRemove) => {
    setReadAccessEmails(readAccessEmails.filter((e) => e.toLowerCase() !== emailToRemove.toLowerCase()))
  }

  const handleAddWriteEmail = () => {
    const email = newWriteEmail.trim().toLowerCase()
    if (!email) return
    if (writeAccessEmails.map((e) => e.toLowerCase()).includes(email)) {
      showToast(`${email} is already in write access list`, 'error')
      return
    }
    setWriteAccessEmails([...writeAccessEmails, email])
    setNewWriteEmail('')
  }

  const handleRemoveWriteEmail = (emailToRemove) => {
    setWriteAccessEmails(writeAccessEmails.filter((e) => e.toLowerCase() !== emailToRemove.toLowerCase()))
  }

  const handleSave = async () => {
    if (!workspace) return
    setIsSaving(true)
    try {
      const updates = {
        name: workspaceName.trim() || workspace.name,
      }
      if (isOwner) {
        updates.readAccessEmails = readAccessEmails
        updates.writeAccessEmails = writeAccessEmails
      }

      await updateWorkspace(workspace.id, updates)
      showToast('Workspace updated successfully', 'success')
      navigate(-1)
    } catch (err) {
      console.error('Failed to update workspace', err)
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <section className="page">
        <p style={{ color: '#94a3b8' }}>Loading workspace settings…</p>
      </section>
    )
  }

  if (!workspace) {
    return (
      <section className="page">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <button type="button" className="ghost-button" onClick={() => navigate(-1)} style={{ width: 'auto', padding: '0.5rem 1rem' }}>
            ← Back
          </button>
          <h2 style={{ margin: 0 }}>Edit Workspace</h2>
        </div>
        <p style={{ color: '#64748b' }}>No active workspace selected.</p>
      </section>
    )
  }

  return (
    <section className="page">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button type="button" className="ghost-button" onClick={() => navigate(-1)} style={{ width: 'auto', padding: '0.5rem 1rem' }}>
          ← Back
        </button>
        <h2 style={{ margin: 0 }}>Edit Workspace</h2>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <h3 style={{ margin: '0 0 0.25rem 0' }}>Workspace Details</h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>ID: {workspace.id}</p>
        </div>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <span>Workspace Name</span>
          <input
            type="text"
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            placeholder="Workspace Name"
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <span>Owner Email</span>
          <input
            type="email"
            value={workspace.ownerEmail || ''}
            disabled
            style={{ opacity: 0.7, cursor: 'not-allowed' }}
          />
        </label>

        {isOwner ? (
          <>
            {/* Read Access Section */}
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1rem', borderRadius: '10px' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#e2e8f0' }}>Read Access Emails</h4>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <input
                  type="email"
                  placeholder="user@example.com"
                  value={newReadEmail}
                  onChange={(e) => setNewReadEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddReadEmail()
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddReadEmail}
                  disabled={!newReadEmail.trim()}
                  style={{ width: 'auto', padding: '0.5rem 1rem' }}
                >
                  Add
                </button>
              </div>

              {readAccessEmails.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {readAccessEmails.map((email) => (
                    <span
                      key={email}
                      style={{
                        background: 'rgba(59, 130, 246, 0.2)',
                        border: '1px solid rgba(59, 130, 246, 0.4)',
                        color: '#93c5fd',
                        borderRadius: '6px',
                        padding: '0.25rem 0.6rem',
                        fontSize: '0.85rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                      }}
                    >
                      {email}
                      <button
                        type="button"
                        onClick={() => handleRemoveReadEmail(email)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#fca5a5',
                          cursor: 'pointer',
                          padding: 0,
                          margin: 0,
                          width: 'auto',
                          fontSize: '0.85rem',
                          fontWeight: 'bold',
                        }}
                        title="Remove read access"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic' }}>
                  No read access emails.
                </p>
              )}
            </div>

            {/* Write Access Section */}
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1rem', borderRadius: '10px' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#e2e8f0' }}>Write Access Emails</h4>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <input
                  type="email"
                  placeholder="user@example.com"
                  value={newWriteEmail}
                  onChange={(e) => setNewWriteEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddWriteEmail()
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddWriteEmail}
                  disabled={!newWriteEmail.trim()}
                  style={{ width: 'auto', padding: '0.5rem 1rem' }}
                >
                  Add
                </button>
              </div>

              {writeAccessEmails.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {writeAccessEmails.map((email) => (
                    <span
                      key={email}
                      style={{
                        background: 'rgba(16, 185, 129, 0.2)',
                        border: '1px solid rgba(16, 185, 129, 0.4)',
                        color: '#6ee7b7',
                        borderRadius: '6px',
                        padding: '0.25rem 0.6rem',
                        fontSize: '0.85rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                      }}
                    >
                      {email}
                      <button
                        type="button"
                        onClick={() => handleRemoveWriteEmail(email)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#fca5a5',
                          cursor: 'pointer',
                          padding: 0,
                          margin: 0,
                          width: 'auto',
                          fontSize: '0.85rem',
                          fontWeight: 'bold',
                        }}
                        title="Remove write access"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic' }}>
                  No write access emails.
                </p>
              )}
            </div>
          </>
        ) : (
          <p style={{ color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>
            Only workspace owners can view and edit access permissions.
          </p>
        )}

        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button type="button" className="ghost-button" onClick={() => navigate(-1)} style={{ width: 'auto' }}>
            Cancel
          </button>
          <button type="button" onClick={handleSave} disabled={isSaving} style={{ width: 'auto', padding: '0.5rem 1.2rem' }}>
            {isSaving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </section>
  )
}

export default WorkspaceSettingsPage
