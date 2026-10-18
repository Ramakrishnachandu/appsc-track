import { useEffect, useState } from 'react'
import { SearchOutlined } from '@mui/icons-material'
import { Alert, Box, Button, Card, CardContent, CircularProgress, InputAdornment, TextField } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { getConfiguredSyllabusData, type MockPaperType } from '../data/dashboardData'
import { getCurrentGroup2Syllabus } from '../data/group2Syllabus'
import { deleteUserNote, getUserNotes, saveUserNote, type UserNote } from '../lib/notesApi'
import { useAppStore } from '../store/useAppStore'

const getSafeSourceUrl = (value: string | null) => {
  if (!value) return undefined
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? url.toString() : undefined
  } catch {
    return undefined
  }
}

export function NotesPage() {
  const { user } = useAppStore()
  const navigate = useNavigate()
  const { prelimsSubjects, mainsSubjects } = getConfiguredSyllabusData()
  const [notes, setNotes] = useState<UserNote[]>([])
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')
  const [paperFilter, setPaperFilter] = useState<'All' | MockPaperType>('All')
  const [kindFilter, setKindFilter] = useState<'All' | 'revision' | 'current-affairs'>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [notesError, setNotesError] = useState<string | null>(null)
  const [editorError, setEditorError] = useState<string | null>(null)
  const [draft, setDraft] = useState({
    title: '',
    paperType: 'Prelims' as MockPaperType,
    kind: 'revision' as 'revision' | 'current-affairs',
    subjectId: prelimsSubjects[0]?.id ?? '',
    content: '',
    topicId: '',
    sourceTitle: '',
    sourceUrl: '',
    sourcePublishedAt: '',
  })

  const noteUserId = user?.id ?? 'demo-user'
  const isLoading = loadedUserId !== noteUserId
  const paperSubjects = draft.paperType === 'Prelims' ? prelimsSubjects : mainsSubjects
  const selectedSubject = paperSubjects.find((subject) => subject.id === draft.subjectId) ?? paperSubjects[0]
  const topicOptions = getCurrentGroup2Syllabus()
    .filter((paper) => draft.paperType === 'Prelims' ? paper.kind === 'screening' : paper.kind === 'mains')
    .flatMap((paper) => paper.subjects.flatMap((subject) => subject.units.flatMap((unit) => unit.topics.map((topic) => ({
      id: topic.id,
      title: topic.title,
      subject: subject.title,
      paper: paper.title,
    })))))

  useEffect(() => {
    let isCurrentUser = true

    void getUserNotes(noteUserId)
      .then((nextNotes) => {
        if (!isCurrentUser) return
        setNotes(nextNotes)
        setNotesError(null)
      })
      .catch((error: unknown) => {
        if (!isCurrentUser) return
        setNotes([])
        setNotesError(error instanceof Error ? error.message : 'Unable to load your notes.')
      })
      .finally(() => {
        if (isCurrentUser) setLoadedUserId(noteUserId)
      })

    return () => {
      isCurrentUser = false
    }
  }, [noteUserId])

  const resetDraft = () => {
    setEditingNoteId(null)
    setEditorError(null)
    setDraft({
      title: '',
      paperType: 'Prelims',
      kind: 'revision',
      subjectId: prelimsSubjects[0]?.id ?? '',
      content: '',
      topicId: '',
      sourceTitle: '',
      sourceUrl: '',
      sourcePublishedAt: '',
    })
  }

  const handleSaveNote = async () => {
    if (!draft.title.trim() || !draft.content.trim()) {
      setEditorError('Add a title and note content before saving.')
      return
    }

    if (draft.kind === 'current-affairs') {
      let sourceUrl: URL
      try {
        sourceUrl = new URL(draft.sourceUrl)
      } catch {
        setEditorError('Add a valid source URL for this current-affairs entry.')
        return
      }
      const publicationDate = new Date(`${draft.sourcePublishedAt}T00:00:00.000Z`)
      const validPublicationDate = /^\d{4}-\d{2}-\d{2}$/.test(draft.sourcePublishedAt)
        && !Number.isNaN(publicationDate.getTime())
        && publicationDate.toISOString().slice(0, 10) === draft.sourcePublishedAt
      if (
        !['http:', 'https:'].includes(sourceUrl.protocol)
        || sourceUrl.username
        || sourceUrl.password
        || !draft.sourceTitle.trim()
        || !validPublicationDate
      ) {
        setEditorError('Current-affairs entries need a source title, an http(s) URL, and a publication date.')
        return
      }
    }

    if (!selectedSubject) {
      setEditorError('Choose a subject before saving this note.')
      return
    }

    setIsSaving(true)
    setEditorError(null)
    setNotesError(null)
    try {
      const saved = await saveUserNote(user?.id ?? 'demo-user', {
        id: editingNoteId ?? undefined,
        title: draft.title,
        content: draft.content,
        subjectId: selectedSubject.id,
        subjectName: selectedSubject.name,
        paperType: draft.paperType,
        kind: draft.kind,
        topicId: draft.topicId || null,
        sourceTitle: draft.kind === 'current-affairs' ? draft.sourceTitle : null,
        sourceUrl: draft.kind === 'current-affairs' ? draft.sourceUrl : null,
        sourcePublishedAt: draft.kind === 'current-affairs' ? draft.sourcePublishedAt : null,
      })

      setNotes((current) => [saved, ...current.filter((item) => item.id !== saved.id)].slice(0, 40))
      resetDraft()
    } catch (error) {
      setEditorError(error instanceof Error ? error.message : 'Unable to save this note. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditNote = (note: UserNote) => {
    const noteSubjects = note.paperType === 'Prelims' ? prelimsSubjects : mainsSubjects
    setEditingNoteId(note.id)
    setEditorError(null)
    setDraft({
      title: note.title,
      paperType: note.paperType,
      kind: note.kind ?? 'revision',
      subjectId: noteSubjects.some((subject) => subject.id === note.subjectId) ? note.subjectId : noteSubjects[0]?.id ?? '',
      content: note.content,
      topicId: note.topicId ?? '',
      sourceTitle: note.sourceTitle ?? '',
      sourceUrl: note.sourceUrl ?? '',
      sourcePublishedAt: note.sourcePublishedAt ?? '',
    })
  }

  const handleDeleteNote = async (noteId: string) => {
    const accepted = window.confirm('Delete this note?')
    if (!accepted) return

    setNotesError(null)
    try {
      await deleteUserNote(user?.id ?? 'demo-user', noteId)
      setNotes((current) => current.filter((item) => item.id !== noteId))
      if (editingNoteId === noteId) resetDraft()
    } catch (error) {
      setNotesError(error instanceof Error ? error.message : 'Unable to delete this note. Please try again.')
    }
  }

  const filteredNotes = notes.filter((note) => {
    const matchesPaper = paperFilter === 'All' || note.paperType === paperFilter
    const matchesKind = kindFilter === 'All' || note.kind === kindFilter
    const query = searchQuery.trim().toLocaleLowerCase()
    const matchesQuery = !query || [note.title, note.subjectName, note.content, note.sourceTitle ?? '', note.sourceUrl ?? ''].some((value) => value.toLocaleLowerCase().includes(query))
    return matchesPaper && matchesKind && matchesQuery
  })
  const sortedNotes = [...filteredNotes].sort((firstNote, secondNote) => {
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

    const parsed = /^\d{4}-\d{2}-\d{2}$/.test(dateValue)
      ? new Date(`${dateValue}T12:00:00`)
      : new Date(dateValue)
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

            {editorError && <Alert severity="error" className="notes-editor-alert">{editorError}</Alert>}

            <TextField
              label="Title"
              value={draft.title}
              onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
              fullWidth
              margin="normal"
              required
              slotProps={{ htmlInput: { maxLength: 120 } }}
            />

            <div className="notes-kind-field native-select-field">
              <label htmlFor="note-kind">Entry type</label>
              <select
                id="note-kind"
                value={draft.kind}
                onChange={(event) => setDraft((current) => ({
                  ...current,
                  kind: event.target.value === 'current-affairs' ? 'current-affairs' : 'revision',
                  topicId: '',
                  subjectId: event.target.value === 'current-affairs' && current.paperType === 'Prelims'
                    ? prelimsSubjects.find((subject) => subject.id === 'current-affairs')?.id ?? current.subjectId
                    : current.subjectId,
                }))}
              >
                <option value="revision">Revision note</option>
                <option value="current-affairs">Current affairs</option>
              </select>
            </div>

            <div className="mock-test-admin-grid">
              <div className="native-select-field">
                <label>Paper type</label>
                <select
                  value={draft.paperType}
                  onChange={(event) => setDraft((current) => ({
                    ...current,
                    paperType: event.target.value === 'Mains' ? 'Mains' : 'Prelims',
                    topicId: '',
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
                  {paperSubjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>{subject.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="notes-kind-field native-select-field">
              <label htmlFor="note-topic">Related syllabus topic (optional)</label>
              <select
                id="note-topic"
                value={draft.topicId}
                onChange={(event) => setDraft((current) => ({ ...current, topicId: event.target.value }))}
              >
                <option value="">No linked topic</option>
                {topicOptions.map((topic) => (
                  <option key={topic.id} value={topic.id}>{topic.title} · {topic.subject}</option>
                ))}
              </select>
            </div>

            {draft.kind === 'current-affairs' && (
              <div className="notes-source-fields">
                <TextField
                  label="Source title / publisher"
                  value={draft.sourceTitle}
                  onChange={(event) => setDraft((current) => ({ ...current, sourceTitle: event.target.value }))}
                  fullWidth
                  required
                />
                <TextField
                  label="Source URL"
                  type="url"
                  value={draft.sourceUrl}
                  onChange={(event) => setDraft((current) => ({ ...current, sourceUrl: event.target.value }))}
                  fullWidth
                  required
                  placeholder="https://"
                />
                <TextField
                  label="Published on"
                  type="date"
                  value={draft.sourcePublishedAt}
                  onChange={(event) => setDraft((current) => ({ ...current, sourcePublishedAt: event.target.value }))}
                  required
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <p>Track a story with its source and date so you can verify the original material. Entries are user-maintained; the app does not generate or verify news.</p>
              </div>
            )}

            <TextField
              label={draft.kind === 'current-affairs' ? 'Summary and exam relevance' : 'Write your revision notes'}
              value={draft.content}
              onChange={(event) => setDraft((current) => ({ ...current, content: event.target.value }))}
              fullWidth
              multiline
              rows={12}
              margin="normal"
              required
            />

            <div className="notes-editor-actions">
              <Button variant="contained" onClick={() => void handleSaveNote()} disabled={isSaving || isLoading}>
                {isSaving ? 'Saving…' : editingNoteId ? 'Update note' : 'Save note'}
              </Button>
              <Button variant="outlined" onClick={resetDraft} disabled={isSaving}>
                {editingNoteId ? 'Cancel edit' : 'Clear'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="panel-card notes-list-panel">
          <CardContent>
            <div className="section-heading-row">
              <div>
                <span className="subject-detail-badge">Saved notes</span>
                <h2>Revision library <span className="notes-count">{filteredNotes.length} / {notes.length}</span></h2>
              </div>
            </div>

            {notesError && <Alert severity="error" className="notes-list-alert">{notesError}</Alert>}

            <div className="notes-library-controls">
              <TextField
                label="Search notes"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                size="small"
                fullWidth
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchOutlined fontSize="small" />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <div className="notes-library-selects">
                <div className="native-select-field compact-select">
                  <label>Entry type</label>
                  <select aria-label="Filter notes by entry type" value={kindFilter} onChange={(event) => setKindFilter(event.target.value as 'All' | 'revision' | 'current-affairs')}>
                    <option value="All">All entries</option>
                    <option value="revision">Revision notes</option>
                    <option value="current-affairs">Current affairs</option>
                  </select>
                </div>
                <div className="native-select-field compact-select">
                  <label>Paper</label>
                  <select aria-label="Filter notes by paper" value={paperFilter} onChange={(event) => setPaperFilter(event.target.value as 'All' | MockPaperType)}>
                    <option value="All">All papers</option>
                    <option value="Prelims">Prelims</option>
                    <option value="Mains">Mains</option>
                  </select>
                </div>
                <div className="native-select-field compact-select">
                  <label>Sort</label>
                  <select aria-label="Sort notes" value={sortOrder} onChange={(event) => setSortOrder(event.target.value as 'newest' | 'oldest')}>
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                  </select>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="notes-loading"><CircularProgress aria-label="Loading notes" /></div>
            ) : sortedNotes.length ? (
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
                                <span className="note-kind-badge">{note.kind === 'current-affairs' ? 'Current affairs' : 'Revision'}</span>
                                {note.topicId && (
                                  <button type="button" className="note-topic-link" onClick={() => navigate(`/study-plan?topic=${encodeURIComponent(note.topicId ?? '')}`)}>
                                    Related topic: {topicOptions.find((topic) => topic.id === note.topicId)?.title ?? note.topicId}
                                  </button>
                                )}
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
                            {note.kind === 'current-affairs' && note.sourceUrl && (
                              <div className="note-source-reference">
                                Source: <a href={getSafeSourceUrl(note.sourceUrl)} target="_blank" rel="noreferrer">{note.sourceTitle || note.sourceUrl}</a>
                                {note.sourcePublishedAt && <span> · Published {formatNoteDate(note.sourcePublishedAt)}</span>}
                              </div>
                            )}
                            <div className="note-meta">Saved on {formatNoteDate(note.updatedAt || note.createdAt)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null
                ))}
              </div>
            ) : (
              <div className="notes-empty-state">
                <strong>{notes.length ? 'No notes match these filters' : 'Your revision library is empty'}</strong>
                <p>{notes.length ? 'Try a different search or paper filter.' : 'Write and save a note to keep important revision points together.'}</p>
                {notes.length > 0 && (
                  <Button size="small" onClick={() => { setSearchQuery(''); setPaperFilter('All'); setKindFilter('All') }}>
                    Clear filters
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Box>
  )
}
