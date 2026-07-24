import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { deleteNoteRemote, getNotesRemote, readNotesFromCache, saveNoteRemote } from '../data/storage'
import ConfirmModal from '../components/ConfirmModal'
import { formatDateKey } from '../utils/dateUtils'

function formatDateDisplay(dateString) {
  if (!dateString) return ''
  const parsed = new Date(`${dateString}T00:00:00`)
  return Number.isNaN(parsed.getTime())
    ? dateString
    : parsed.toLocaleDateString('en', { year: 'numeric', month: 'short', day: 'numeric' })
}

function NotesPage({ personId: propPersonId, month }) {
  const params = useParams()
  const navigate = useNavigate()
  const personId = propPersonId || params.personId || ''

  const [notes, setNotes] = useState(() => readNotesFromCache(personId))
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingNoteId, setEditingNoteId] = useState(null)
  const [deletingNoteId, setDeletingNoteId] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [formData, setFormData] = useState({
    date: formatDateKey(),
    title: '',
    text: '',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState('')

  const fetchNotes = async () => {
    setNotes(readNotesFromCache(personId))
  }

  const handleOpenAddForm = () => {
    setEditingNoteId(null)
    setFormData({
      date: formatDateKey(),
      title: '',
      text: '',
    })
    setIsFormOpen(true)
  }

  const handleEditClick = (note) => {
    setEditingNoteId(note._id || note.id)
    setFormData({
      date: note.date || formatDateKey(),
      title: note.title || '',
      text: note.text || '',
    })
    setIsFormOpen(true)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingNoteId(null)
    setFormData({ date: formatDateKey(), title: '', text: '' })
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    if (!formData.text.trim() && !formData.title.trim()) {
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        date: formData.date || formatDateKey(),
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
  const rawFilteredNotes = month ? notes.filter((note) => note.date && note.date.slice(0, 7) === month) : notes
  const filteredNotes = [...rawFilteredNotes].sort((a, b) => (b.date || '').localeCompare(a.date || ''))

  return (
    <div className={isStandalonePage ? 'page' : 'notes-section'}>
      {isStandalonePage && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2>Notes</h2>
          <button type="button" className="ghost-button" onClick={() => navigate('/people')} style={{ width: 'auto' }}>
            Back
          </button>
        </div>
      )}

      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: filteredNotes.length > 0 ? '1rem' : 0 }}>
          <div>
            <h3 style={{ margin: 0 }}>Notes</h3>
          </div>
          <button
            type="button"
            onClick={handleOpenAddForm}
            style={{ width: 'auto', padding: '0.5rem 0.9rem', fontSize: '0.85rem' }}
          >
            + Add Note
          </button>
        </div>

        {/* Notes List inside header card */}
        {filteredNotes.length === 0 ? (
          <p style={{ color: '#64748b', fontStyle: 'italic', margin: 0 }}>
            No notes found.
          </p>
        ) : (
          <div className="card-grid">
            {filteredNotes.map((note) => {
              const noteId = note._id || note.id
              return (
                <article
                  key={noteId}
                  className="card card-tile note-card"
                  onClick={() => handleEditClick(note)}
                  style={{ cursor: 'pointer', background: 'rgba(15, 23, 42, 0.6)' }}
                >
                  <div className="card-row">
                    <div>
                      <span className="note-date" style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                        {formatDateDisplay(note.date)}
                      </span>
                    </div>
                    {note.title && (
                        <h3 style={{ margin: 0 }}>{note.title}</h3>
                      )}
                    <div className="action-group">
                      <button
                        type="button"
                        className="delete-button"
                        onClick={(e) => handleDeleteClick(e, noteId)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  {note.text && (
                    <p style={{ margin: '0.6rem 0 0', color: '#cbd5e1', whiteSpace: 'pre-wrap', fontSize: '0.925rem' }}>
                      {note.text}
                    </p>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Note Popup Modal */}
      {isFormOpen && (
        <div className="modal-backdrop" onClick={handleCloseForm}>
          <div className="modal-container card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <button
              type="button"
              className="modal-close-btn"
              onClick={handleCloseForm}
            >
              ✕
            </button>
            <h3 className="modal-title" style={{ marginBottom: '1.25rem', color: '#f8fafc' }}>
              {editingNoteId ? 'Edit Note' : 'New Note'}
            </h3>
            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontWeight: '600', color: '#e2e8f0' }}>
                <span>Date</span>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.85rem',
                    borderRadius: '10px',
                    border: '1px solid rgba(148, 163, 184, 0.35)',
                    background: 'rgba(15, 23, 42, 0.8)',
                    color: '#f8fafc',
                  }}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontWeight: '600', color: '#e2e8f0' }}>
                <span>Title</span>
                <input
                  type="text"
                  placeholder="Title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.85rem',
                    borderRadius: '10px',
                    border: '1px solid rgba(148, 163, 184, 0.35)',
                    background: 'rgba(15, 23, 42, 0.8)',
                    color: '#f8fafc',
                  }}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontWeight: '600', color: '#e2e8f0' }}>
                <span>Text</span>
                <textarea
                  rows="4"
                  placeholder="Write your note here..."
                  value={formData.text}
                  onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.85rem',
                    borderRadius: '10px',
                    border: '1px solid rgba(148, 163, 184, 0.35)',
                    background: 'rgba(15, 23, 42, 0.8)',
                    color: '#f8fafc',
                    resize: 'vertical',
                  }}
                />
              </label>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={handleCloseForm}
                  style={{ width: 'auto', padding: '0.65rem 1.25rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  style={{ width: 'auto', padding: '0.65rem 1.25rem' }}
                >
                  {isSaving ? 'Saving…' : editingNoteId ? 'Save Note' : 'Create Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
