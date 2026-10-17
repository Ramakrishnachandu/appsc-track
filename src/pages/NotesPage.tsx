import { useEffect, useState } from 'react'
import { Box, Button, Card, CardContent, TextField } from '@mui/material'
import { getConfiguredSyllabusData, type MockPaperType } from '../data/dashboardData'
import { deleteUserNote, getUserNotes, saveUserNote, type UserNote } from '../lib/notesApi'
import { useAppStore } from '../store/useAppStore'

export function NotesPage() {
  const { user } = useAppStore()
  const { prelimsSubjects, mainsSubjects } = getConfiguredSyllabusData()
  const subjectOptions = [...prelimsSubjects, ...mainsSubjects]
  const [notes, setNotes] = useState<UserNote[]>([])
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')
  const [draft, setDraft] = useState({
    title: '',
    paperType: 'Prelims' as MockPaperType,
    subjectId: prelimsSubjects[0]?.id ?? '',
    content: '',
  })

  const selectedSubject = subjectOptions.find((subject) => subject.id === draft.subjectId) ?? subjectOptions[0]

  const loadNotes = async () => {
    const nextNotes = await getUserNotes(user?.id ?? 'demo-user')
    setNotes(nextNotes)
  }

  useEffect(() => {
    void loadNotes()
  }, [user?.id])

  const resetDraft = () => {
    setEditingNoteId(null)
    setDraft({
      title: '',
      paperType: 'Prelims',
      subjectId: prelimsSubjects[0]?.id ?? '',
      content: '',
    })
  }

  const handleSaveNote = async () => {
    if (!selectedSubject || !draft.title.trim() || !draft.content.trim()) {
      return
    }

    const saved = await saveUserNote(user?.id ?? 'demo-user', {
      id: editingNoteId ?? undefined,
      title: draft.title,
      content: draft.content,
      subjectId: selectedSubject.id,
      subjectName: selectedSubject.name,
      paperType: draft.paperType,
    })

    setNotes((current) => [saved, ...current.filter((item) => item.id !== saved.id)].slice(0, 40))
    resetDraft()
  }

  const handleEditNote = (note: UserNote) => {
    setEditingNoteId(note.id)
    setDraft({
      title: note.title,
      paperType: note.paperType,
      subjectId: note.subjectId || subjectOptions[0]?.id || '',
      content: note.content,
    })
  }

  const handleDeleteNote = async (noteId: string) => {
    const accepted = window.confirm('Delete this note?')
    if (!accepted) return

    await deleteUserNote(user?.id ?? 'demo-user', noteId)
    setNotes((current) => current.filter((item) => item.id !== noteId))
    if (editingNoteId === noteId) {
      resetDraft()
    }
  }

  const sortedNotes = [...notes].sort((firstNote, secondNote) => {
    const firstDate = new Date(firstNote.updatedAt || firstNote.createdAt).getTime()
    const secondDate = new Date(secondNote.updatedAt || secondNote.createdAt).getTime()
    return sortOrder === 'newest' ? secondDate - firstDate : firstDate - secondDate
  })

  const groupedNotes = sortedNotes.reduce<Record<string, UserNote[]>>((accumulator, note) => {
    const group = note.paperType === 'Mains' ? 'Mains' : 'Prelims'
    accumulator[group] = accumulator[group] ? [...accumulator[group], note] : [note]
    return accumulator
  }, {})

  const formatNoteDate = (dateValue?: string) => {
    if (!dateValue) return 'No date'

    const parsed = new Date(dateValue)
    if (Number.isNaN(parsed.getTime())) return 'No date'

    return parsed.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Box className="page-shell">
      <div className="notes-layout">
        <Card className="panel-card notes-editor-panel">
          <CardContent>
            <div className="section-heading-row">
              <div>
                <span className="subject-detail-badge">Revision notes</span>
                <h2>{editingNoteId ? 'Edit note' : 'Add new note'}</h2>
              </div>
            </div>

            <TextField
              label="Title"
              value={draft.title}
              onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
              fullWidth
              margin="normal"
            />

            <div className="mock-test-admin-grid">
              <div className="native-select-field">
                <label>Paper type</label>
                <select
                  value={draft.paperType}
                  onChange={(event) => setDraft((current) => ({
                    ...current,
                    paperType: event.target.value as MockPaperType,
                    subjectId: event.target.value === 'Prelims'
                      ? prelimsSubjects[0]?.id ?? current.subjectId
                      : mainsSubjects[0]?.id ?? current.subjectId,
                  }))}
                >
                  <option value="Prelims">Prelims</option>
                  <option value="Mains">Mains</option>
                </select>
              </div>

              <div className="native-select-field">
                <label>Subject</label>
                <select
                  value={draft.subjectId}
                  onChange={(event) => setDraft((current) => ({ ...current, subjectId: event.target.value }))}
                >
                  {(draft.paperType === 'Prelims' ? prelimsSubjects : mainsSubjects).map((subject) => (
                    <option key={subject.id} value={subject.id}>{subject.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <TextField
              label="Write your revision notes"
              value={draft.content}
              onChange={(event) => setDraft((current) => ({ ...current, content: event.target.value }))}
              fullWidth
              multiline
              rows={12}
              margin="normal"
            />

            <div className="admin-actions" style={{ justifyContent: 'flex-start', gap: 12 }}>
              <Button variant="contained" onClick={() => void handleSaveNote()}>
                {editingNoteId ? 'Update note' : 'Save note'}
              </Button>
              <Button variant="outlined" onClick={resetDraft}>Clear</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="panel-card notes-list-panel">
          <CardContent>
            <div className="section-heading-row">
              <div>
                <span className="subject-detail-badge">Saved notes</span>
                <h2>Revision library</h2>
              </div>
              <div className="native-select-field compact-select">
                <label>Sort</label>
                <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value as 'newest' | 'oldest')}>
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                </select>
              </div>
            </div>

            {Object.keys(groupedNotes).length ? (
              <div className="notes-groups">
                {(['Prelims', 'Mains'] as const).map((paperType) => (
                  groupedNotes[paperType]?.length ? (
                    <div key={paperType} className="notes-group-block">
                      <h3>{paperType}</h3>
                      <div className="notes-stack">
                        {groupedNotes[paperType].map((note) => (
                          <div key={note.id} className="note-item">
                            <div className="note-item-header">
                              <div>
                                <strong>{note.title}</strong>
                                {/* <p>{note.subjectName}</p> */}
                              </div>
                              <div className="note-actions">
                                <Button size="small" variant="text" onClick={() => handleEditNote(note)}>Edit</Button>
                                <Button size="small" color="warning" variant="text" onClick={() => void handleDeleteNote(note.id)}>Delete</Button>
                              </div>
                            </div>

                            <div className="note-card-meta">
                              <span className="note-pill">{note.subjectName}</span>
                              <span className="note-pill note-pill-secondary">{note.paperType}</span>
                            </div>

                            <div className="note-summary-label">Description</div>
                            <div className="note-content-preview">{note.content || 'No description added yet.'}</div>
                            <div className="note-meta">Saved on {formatNoteDate(note.updatedAt || note.createdAt)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null
                ))}
              </div>
            ) : (
              <p className="analytics-empty-state">No notes saved yet. Write a quick revision note for a subject and paper type.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </Box>
  )
}
