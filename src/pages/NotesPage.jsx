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
  const filteredNotes = month ? notes.filter((note) => note.date && note.date.slice(0,7) === month) : notes

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
        {filteredNotes.length === 0 ? (
            <div className="card">
              <p style={{ margin: 0, color: '#94a3b8' }}>No notes yet.</p>
            </div>
          ) : (
            filteredNotes.map((note) => {
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
