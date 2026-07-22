import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { deleteNoteRemote, getNotesRemote, readNotesFromCache, saveNoteRemote } from '../data/storage'
import ConfirmModal from '../components/ConfirmModal'

function getTodayString() {
  return new Date().toISOString().slice(0, 10)
}

function formatDateDisplay(dateString) {
  if (!dateString) return ''
  const parsed = new Date(`${dateString}T00:00:00`)
  return Number.isNaN(parsed.getTime())
    ? dateString
    : parsed.toLocaleDateString('en', { year: 'numeric', month: 'short', day: 'numeric' })
}

function NotesPage({ personId: propPersonId }) {
  const params = useParams()
  const navigate = useNavigate()
  const personId = propPersonId || params.personId || ''

  const [notes, setNotes] = useState(() => readNotesFromCache(personId))
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingNoteId, setEditingNoteId] = useState(null)
  const [deletingNoteId, setDeletingNoteId] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [formData, setFormData] = useState({
    date: getTodayString(),
    title: '',
    text: '',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const fetchNotes = async () => {
    const cached = readNotesFromCache(personId)
    if (cached && cached.length > 0) {
      setNotes(cached)
      setIsLoading(false)
    } else {
      setIsLoading(true)
    }

    try {
      const loadedNotes = await getNotesRemote(personId)
      setNotes(loadedNotes)
    } catch {
      // Keep cached notes on error
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchNotes()
  }, [personId])

  const handleOpenAddForm = () => {
    setEditingNoteId(null)
    setFormData({
      date: getTodayString(),
      title: '',
      text: '',
    })
    setIsFormOpen(true)
  }

  const handleEditClick = (note) => {
    setEditingNoteId(note._id || note.id)
    setFormData({
      date: note.date || getTodayString(),
      title: note.title || '',
      text: note.text || '',
    })
    setIsFormOpen(true)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingNoteId(null)
    setFormData({ date: getTodayString(), title: '', text: '' })
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    if (!formData.text.trim() && !formData.title.trim()) {
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        date: formData.date || getTodayString(),
        title: formData.title.trim(),
        text: formData.text.trim(),
        personId,
      }
      if (editingNoteId) {
        payload.id = editingNoteId
      }

      await saveNoteRemote(payload)
      handleCloseForm()
      await fetchNotes()
    } catch {
      // Keep UI responsive
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteClick = (e, noteId) => {
    e.stopPropagation()
    setDeletingNoteId(noteId)
  }

  const handleConfirmDeleteNote = async () => {
    if (!deletingNoteId) return

    setIsDeleting(true)
    try {
      await deleteNoteRemote(deletingNoteId, personId)
      if (editingNoteId === deletingNoteId) {
        handleCloseForm()
      }
      setDeletingNoteId(null)
      await fetchNotes()
    } catch {
      // Keep UI responsive
    } finally {
      setIsDeleting(false)
    }
  }


  // Header navigation when rendered as standalone route
  const isStandalonePage = !propPersonId

  return (
    <div className={isStandalonePage ? 'page' : 'notes-section'}>
      {isStandalonePage && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2>Notes</h2>
          <button type="button" className="ghost-button" onClick={() => navigate('/people')}>
            Back
          </button>
        </div>
      )}

      {/* Full width centered Add note button */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
        <button
          type="button"
          onClick={handleOpenAddForm}
          style={{ width: '100%', maxWidth: 'none' }}
        >
          Add note
        </button>
      </div>

      {/* Add / Edit Note Form */}
      {isFormOpen && (
        <div className="card note-form-card" style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ marginTop: 0, marginBottom: '0.85rem' }}>
            {editingNoteId ? 'Edit note' : 'New note'}
          </h3>
          <form onSubmit={handleFormSubmit}>
            <label>
              <span>Date</span>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </label>

            <label>
              <span>Title</span>
              <input
                type="text"
                placeholder="Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </label>

            <label>
              <span>Text</span>
              <textarea
                rows="4"
                placeholder="Write your note here..."
                value={formData.text}
                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                required
              />
            </label>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button type="submit" disabled={isSaving} style={{ flex: 1 }}>
                {isSaving ? 'Saving…' : editingNoteId ? 'Save note' : 'Create note'}
              </button>
              <button
                type="button"
                className="ghost-button"
                onClick={handleCloseForm}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Notes List */}
      <div className="notes-list" style={{ display: 'grid', gap: '0.85rem' }}>
        {isLoading && notes.length === 0 ? (
          <div className="card">
            <p>Loading notes…</p>
          </div>
        ) : notes.length === 0 ? (
          <div className="card">
            <p style={{ margin: 0, color: '#94a3b8' }}>No notes yet.</p>
          </div>
        ) : (
          notes.map((note) => {
            const noteId = note._id || note.id
            return (
              <article
                key={noteId}
                className="card note-card"
                onClick={() => handleEditClick(note)}
                style={{ cursor: 'pointer' }}
              >
                <div className="note-header">
                  <span className="note-date">{formatDateDisplay(note.date)}</span>
                  <button
                    type="button"
                    className="delete-button"
                    onClick={(e) => handleDeleteClick(e, noteId)}
                  >
                    Delete note
                  </button>
                </div>

                {note.title && (
                  <h4 style={{ margin: '0.35rem 0', color: '#f8fafc', fontSize: '1.05rem' }}>
                    {note.title}
                  </h4>
                )}

                <p style={{ margin: '0.35rem 0 0', color: '#cbd5e1', whiteSpace: 'pre-wrap' }}>
                  {note.text}
                </p>
              </article>
            )
          })
        )}
      </div>

      <ConfirmModal
        isOpen={Boolean(deletingNoteId)}
        title="Delete Note"
        message="Are you sure you want to delete this note? This action cannot be undone."
        confirmText="Delete Note"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDeleteNote}
        onCancel={() => setDeletingNoteId(null)}
      />
    </div>
  )
}

export default NotesPage
