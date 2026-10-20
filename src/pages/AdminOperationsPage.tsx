import { useEffect, useMemo, useState } from 'react'
import { Alert, Box, Button, Card, CardContent, Chip, MenuItem, TextField } from '@mui/material'
import { NavLink, useLocation } from 'react-router-dom'
import { getAllSyllabusTopics } from '../data/group2Syllabus'
import {
  deleteAdminContent,
  getAdminContent,
  getAdminContentRevisions,
  getAdminMetrics,
  getSupportRequests,
  saveAdminContent,
  updateSupportRequest,
  type AdminContentInput,
  type AdminContentItem,
  type AdminContentKind,
  type AdminContentRevision,
  type AdminContentStatus,
  type AdminMetrics,
  type SupportRequest,
} from '../lib/adminContentApi'
import { useAppStore } from '../store/useAppStore'

type Section = 'overview' | 'questions' | 'notices' | 'resources' | 'support'
type ContentDraft = {
  id: string
  kind: AdminContentKind
  title: string
  summary: string
  topicId: string
  prompt: string
  options: string
  correctIndex: number
  explanation: string
  category: string
  resourceUrl: string
  sourceTitle: string
  sourceUrl: string
  sourcePublishedAt: string
  replacesId: string
  status: AdminContentStatus
}

const sectionLinks: { section: Section; label: string; path: string }[] = [
  { section: 'overview', label: 'Platform overview', path: '/admin/operations' },
  { section: 'questions', label: 'Question bank', path: '/admin/questions' },
  { section: 'notices', label: 'Official notices', path: '/admin/notices' },
  { section: 'resources', label: 'Resources library', path: '/admin/resources' },
  { section: 'support', label: 'Support inbox', path: '/admin/support' },
]

const blankDraft = (kind: AdminContentKind = 'question'): ContentDraft => ({
  id: '',
  kind,
  title: '',
  summary: '',
  topicId: getAllSyllabusTopics()[0]?.id ?? '',
  prompt: '',
  options: '',
  correctIndex: 0,
  explanation: '',
  category: '',
  resourceUrl: '',
  sourceTitle: '',
  sourceUrl: '',
  sourcePublishedAt: '',
  replacesId: '',
  status: 'draft',
})

const parseDraft = (item: AdminContentItem): ContentDraft => ({
  ...blankDraft(item.kind),
  id: item.id,
  kind: item.kind,
  title: item.title,
  summary: typeof item.content.summary === 'string' ? item.content.summary : '',
  topicId: typeof item.content.topicId === 'string' ? item.content.topicId : '',
  prompt: typeof item.content.prompt === 'string' ? item.content.prompt : '',
  options: Array.isArray(item.content.options) ? item.content.options.join('\n') : '',
  correctIndex: typeof item.content.correctIndex === 'number' ? item.content.correctIndex : 0,
  explanation: typeof item.content.explanation === 'string' ? item.content.explanation : '',
  category: typeof item.content.category === 'string' ? item.content.category : '',
  resourceUrl: typeof item.content.resourceUrl === 'string' ? item.content.resourceUrl : '',
  sourceTitle: item.sourceTitle,
  sourceUrl: item.sourceUrl,
  sourcePublishedAt: item.sourcePublishedAt,
  replacesId: item.replacesId,
  status: item.status,
})

const isHttpsUrl = (value: string) => {
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

const makeInput = (draft: ContentDraft, userId: string, status = draft.status): AdminContentInput => {
  const content: AdminContentInput['content'] = draft.kind === 'question'
    ? {
      topicId: draft.topicId,
      prompt: draft.prompt.trim(),
      options: draft.options.split('\n').map((option) => option.trim()).filter(Boolean),
      correctIndex: draft.correctIndex,
      explanation: draft.explanation.trim(),
    }
    : draft.kind === 'notice'
      ? { summary: draft.summary.trim(), category: draft.category.trim() }
      : { summary: draft.summary.trim(), category: draft.category.trim(), resourceUrl: draft.resourceUrl.trim() }

  return {
    id: draft.id,
    kind: draft.kind,
    title: draft.title.trim(),
    content,
    status,
    sourceTitle: draft.sourceTitle.trim(),
    sourceUrl: draft.sourceUrl.trim(),
    sourcePublishedAt: draft.sourcePublishedAt,
    replacesId: draft.replacesId,
    createdBy: userId,
  }
}

const validateDraft = (draft: ContentDraft) => {
  if (!draft.title.trim()) return 'Enter a title.'
  if (!draft.sourceTitle.trim() || !isHttpsUrl(draft.sourceUrl.trim())) return 'Add a source title and a valid HTTPS source URL.'
  if (draft.kind === 'question') {
    const options = draft.options.split('\n').map((option) => option.trim()).filter(Boolean)
    if (!draft.topicId) return 'Select a syllabus topic.'
    if (!draft.prompt.trim() || options.length !== 4 || options.some((option) => !option)) return 'Questions need a prompt and exactly four non-empty options, one per line.'
    if (!draft.explanation.trim()) return 'Add an explanation for the answer.'
    if (!Number.isInteger(draft.correctIndex) || draft.correctIndex < 0 || draft.correctIndex > 3) return 'Select a correct option from 1 to 4.'
  }
  if (!draft.summary.trim()) return 'Add a description or notice summary.'
  if (draft.kind === 'resource' && !isHttpsUrl(draft.resourceUrl.trim())) return 'Resources need a valid HTTPS destination URL.'
  return ''
}

const metricLabels: { key: keyof AdminMetrics; label: string }[] = [
  { key: 'candidate_count', label: 'Candidate accounts' },
  { key: 'mock_attempt_count', label: 'Mock attempts' },
  { key: 'published_question_count', label: 'Published questions' },
  { key: 'published_notice_count', label: 'Published notices' },
  { key: 'published_resource_count', label: 'Published resources' },
  { key: 'pending_review_count', label: 'Awaiting review' },
  { key: 'open_support_count', label: 'Open support requests' },
]

const statusColor = (status: AdminContentStatus) => status === 'published' ? 'success' : status === 'review' ? 'warning' : 'default'

export function AdminOperationsPage() {
  const user = useAppStore((state) => state.user)
  const location = useLocation()
  const section = sectionLinks.find((item) => item.path === location.pathname)?.section ?? 'overview'
  const kind: AdminContentKind | undefined = section === 'questions' ? 'question' : section === 'notices' ? 'notice' : section === 'resources' ? 'resource' : undefined
  const [items, setItems] = useState<AdminContentItem[]>([])
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null)
  const [requests, setRequests] = useState<SupportRequest[]>([])
  const [draft, setDraft] = useState<ContentDraft>(() => blankDraft(kind))
  const [revisions, setRevisions] = useState<AdminContentRevision[]>([])
  const [revisionsFor, setRevisionsFor] = useState('')
  const [responses, setResponses] = useState<Record<string, string>>({})
  const [message, setMessage] = useState<{ text: string; severity: 'success' | 'error' | 'info' } | null>(null)
  const [busy, setBusy] = useState(false)
  const [reload, setReload] = useState(0)
  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const [loadedMetrics, loadedItems, loadedRequests] = await Promise.all([
          getAdminMetrics(),
          kind ? getAdminContent({ kind, includeUnpublished: true }) : Promise.resolve([]),
          section === 'support' ? getSupportRequests(user?.id ?? '', true) : Promise.resolve([]),
        ])
        if (!active) return
        setMetrics(loadedMetrics)
        setItems(loadedItems)
        setRequests(loadedRequests)
      } catch (error) {
        if (active) setMessage({ text: error instanceof Error ? error.message : 'Unable to load admin operations.', severity: 'error' })
      }
    }
    void load()
    return () => { active = false }
  }, [kind, reload, section, user?.id])

  const topicOptions = useMemo(() => getAllSyllabusTopics(), [])

  const handleSave = async (status: AdminContentStatus) => {
    if (!user?.id) return
    const validationError = validateDraft(draft)
    if (validationError) {
      setMessage({ text: validationError, severity: 'error' })
      return
    }
    setBusy(true)
    try {
      await saveAdminContent(makeInput(draft, user.id, status))
      setDraft(blankDraft(kind))
      setMessage({ text: status === 'review' ? 'Content submitted for review.' : status === 'published' ? 'Content published for candidates.' : 'Draft saved.', severity: 'success' })
      setReload((value) => value + 1)
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'Unable to save this content.', severity: 'error' })
    } finally {
      setBusy(false)
    }
  }

  const transitionItem = async (item: AdminContentItem, status: AdminContentStatus) => {
    if (!user?.id) return
    if (status === 'published' && item.status !== 'review') {
      setMessage({ text: 'Submit content for review before publishing.', severity: 'error' })
      return
    }
    setBusy(true)
    try {
      await saveAdminContent({ ...item, status, createdBy: user.id })
      setMessage({ text: `${item.title} moved to ${status}.`, severity: 'success' })
      setReload((value) => value + 1)
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'Unable to update content status.', severity: 'error' })
    } finally {
      setBusy(false)
    }
  }

  const removeItem = async (item: AdminContentItem) => {
    if (!window.confirm(`Delete "${item.title}" and its revision history?`)) return
    setBusy(true)
    try {
      await deleteAdminContent(item.id)
      setMessage({ text: 'Content deleted.', severity: 'success' })
      setReload((value) => value + 1)
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'Unable to delete this content.', severity: 'error' })
    } finally {
      setBusy(false)
    }
  }

  const showRevisions = async (itemId: string) => {
    try {
      const history = await getAdminContentRevisions(itemId)
      setRevisions(history)
      setRevisionsFor(itemId)
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'Unable to load version history.', severity: 'error' })
    }
  }

  const restoreRevisionAsDraft = (revision: AdminContentRevision) => {
    const item = items.find((entry) => entry.id === revisionsFor)
    if (!item) return
    const restored = parseDraft({
      ...item,
      title: revision.snapshot.title ?? item.title,
      content: revision.snapshot.content ?? item.content,
      status: 'draft',
      sourceTitle: revision.snapshot.source_title ?? item.sourceTitle,
      sourceUrl: revision.snapshot.source_url ?? item.sourceUrl,
      sourcePublishedAt: revision.snapshot.source_published_at ?? item.sourcePublishedAt,
    })
    if (item.status === 'published') {
      restored.id = ''
      restored.replacesId = item.id
    }
    setDraft(restored)
    setMessage({ text: `Version ${revision.version} loaded into the editor as a draft. Save and submit it for review to restore it.`, severity: 'info' })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const updateRequest = async (request: SupportRequest, status: SupportRequest['status']) => {
    setBusy(true)
    try {
      await updateSupportRequest({
        ...request,
        status,
        adminResponse: responses[request.id] ?? request.adminResponse,
      })
      setMessage({ text: 'Support request updated.', severity: 'success' })
      setReload((value) => value + 1)
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'Unable to update support request.', severity: 'error' })
    } finally {
      setBusy(false)
    }
  }

  const editItem = (item: AdminContentItem) => {
    const editDraft = parseDraft(item)
    if (item.status === 'published') {
      editDraft.id = ''
      editDraft.replacesId = item.id
      editDraft.status = 'draft'
      setMessage({ text: `A draft revision of "${item.title}" is being created. Candidates will keep seeing the current published version until this revision is approved.`, severity: 'info' })
    } else {
      setMessage({ text: `Editing "${item.title}". Save as draft or submit it for review.`, severity: 'info' })
    }
    setDraft(editDraft)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <Box className="page-shell">
      <div className="admin-rail-shell">
        <aside className="admin-subnav-panel">
          <div className="admin-subnav-header">Admin operations</div>
          {sectionLinks.map((link) => (
            <NavLink key={link.path} to={link.path} className={() => section === link.section ? 'admin-subnav-item active' : 'admin-subnav-item'}>
              {link.label}
            </NavLink>
          ))}
        </aside>

        <Card className="panel-card admin-panel-card">
          <CardContent>
            <div className="admin-header-row">
              <div>
                <h2>{sectionLinks.find((link) => link.section === section)?.label}</h2>
                <p>Manage shared learning content and platform operations without accessing private study notes or individual progress.</p>
              </div>
              <Button variant="outlined" onClick={() => setReload((value) => value + 1)}>Refresh</Button>
            </div>
            {message && <Alert severity={message.severity} sx={{ mb: 2 }} onClose={() => setMessage(null)}>{message.text}</Alert>}

            {section === 'overview' && (
              <>
                <div className="admin-ops-metrics">
                  {metricLabels.map(({ key, label }) => (
                    <div className="admin-ops-metric" key={key}><span>{label}</span><strong>{metrics?.[key] ?? '—'}</strong></div>
                  ))}
                </div>
                <Alert severity="info" sx={{ mt: 2 }}>
                  Metrics are aggregate counts only. Candidate notes, plans, and identifiable answer histories are not exposed here; account and attempt totals are unavailable in local/demo mode. Account access changes require a trusted server-side admin workflow and are intentionally not offered in this browser panel.
                </Alert>
              </>
            )}

            {kind && (
              <>
                <div className="admin-content-editor">
                  <h3>{draft.id ? 'Edit shared content' : `Create ${kind}`}</h3>
                  <TextField label="Title" value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} fullWidth />
                  {kind === 'question' ? (
                    <>
                      <TextField select label="Syllabus topic" value={draft.topicId} onChange={(event) => setDraft((current) => ({ ...current, topicId: event.target.value }))} fullWidth>
                        {topicOptions.map((topic) => <MenuItem key={topic.id} value={topic.id}>{topic.title}</MenuItem>)}
                      </TextField>
                      <TextField label="Question prompt" value={draft.prompt} onChange={(event) => setDraft((current) => ({ ...current, prompt: event.target.value }))} fullWidth multiline minRows={2} />
                      <TextField label="Four options (one per line)" value={draft.options} onChange={(event) => setDraft((current) => ({ ...current, options: event.target.value }))} fullWidth multiline minRows={4} />
                      <TextField select label="Correct option" value={draft.correctIndex} onChange={(event) => setDraft((current) => ({ ...current, correctIndex: Number(event.target.value) }))} fullWidth>
                        {[0, 1, 2, 3].map((index) => <MenuItem key={index} value={index}>Option {index + 1}</MenuItem>)}
                      </TextField>
                      <TextField label="Answer explanation" value={draft.explanation} onChange={(event) => setDraft((current) => ({ ...current, explanation: event.target.value }))} fullWidth multiline minRows={2} />
                    </>
                  ) : (
                    <>
                      <TextField label={kind === 'notice' ? 'Notice summary' : 'Resource description'} value={draft.summary} onChange={(event) => setDraft((current) => ({ ...current, summary: event.target.value }))} fullWidth multiline minRows={3} />
                      <TextField label="Category" value={draft.category} onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))} fullWidth />
                      {kind === 'resource' && <TextField label="Resource destination URL (HTTPS)" value={draft.resourceUrl} onChange={(event) => setDraft((current) => ({ ...current, resourceUrl: event.target.value }))} fullWidth />}
                    </>
                  )}
                  <div className="admin-content-source-fields">
                    <TextField label="Source / issuing organization" value={draft.sourceTitle} onChange={(event) => setDraft((current) => ({ ...current, sourceTitle: event.target.value }))} fullWidth />
                    <TextField label="Source URL (HTTPS)" value={draft.sourceUrl} onChange={(event) => setDraft((current) => ({ ...current, sourceUrl: event.target.value }))} fullWidth />
                    <TextField label="Source publication date" type="date" value={draft.sourcePublishedAt} onChange={(event) => setDraft((current) => ({ ...current, sourcePublishedAt: event.target.value }))} slotProps={{ inputLabel: { shrink: true } }} fullWidth />
                  </div>
                  <Alert severity="info">Content is not represented as official or verified until an administrator checks its cited source. Publishing is limited to reviewed content.</Alert>
                  <div className="admin-actions">
                    <Button variant="outlined" disabled={busy} onClick={() => void handleSave('draft')}>Save draft</Button>
                    <Button variant="contained" disabled={busy} onClick={() => void handleSave('review')}>Submit for review</Button>
                    {draft.id && <Button color="inherit" onClick={() => setDraft(blankDraft(kind))}>Cancel edit</Button>}
                  </div>
                </div>
                <h3>Content queue</h3>
                <div className="admin-ops-content-list">
                  {items.map((item) => (
                    <article className="admin-ops-content-item" key={item.id}>
                      <div>
                        <div className="admin-ops-item-heading"><strong>{item.title}</strong><Chip size="small" label={item.status} color={statusColor(item.status)} /></div>
                        <p>{item.sourceTitle || 'Source not specified'}{item.sourcePublishedAt ? ` • ${item.sourcePublishedAt}` : ''}</p>
                      </div>
                      <div className="admin-ops-item-actions">
                        <Button size="small" onClick={() => editItem(item)}>Edit</Button>
                        <Button size="small" onClick={() => void showRevisions(item.id)}>History</Button>
                        {item.status === 'draft' && <Button size="small" onClick={() => void transitionItem(item, 'review')}>Submit review</Button>}
                        {item.status === 'review' && <Button size="small" color="success" onClick={() => void transitionItem(item, 'published')}>Publish</Button>}
                        {item.status !== 'archived' && <Button size="small" color="warning" onClick={() => void transitionItem(item, 'archived')}>Archive</Button>}
                        <Button size="small" color="error" onClick={() => void removeItem(item)}>Delete</Button>
                      </div>
                    </article>
                  ))}
                  {!items.length && <p>No content in this queue yet.</p>}
                </div>
                {revisionsFor && (
                  <div className="admin-revision-list">
                    <div className="admin-header-row">
                      <h3>Version history</h3>
                      <Button size="small" onClick={() => setRevisionsFor('')}>Close</Button>
                    </div>
                    {revisions.map((revision) => (
                      <div className="admin-revision-row" key={revision.id}>
                        <div className="admin-ops-item-heading">
                          <strong>Version {revision.version}</strong>
                          <Button size="small" onClick={() => restoreRevisionAsDraft(revision)}>Restore as draft</Button>
                        </div>
                        <span>{revision.snapshot.status ?? 'saved'} • {new Date(revision.createdAt).toLocaleString()}</span>
                        <p>{revision.snapshot.title}</p>
                      </div>
                    ))}
                    {!revisions.length && <p>No saved versions found.</p>}
                  </div>
                )}
              </>
            )}

            {section === 'support' && (
              <div className="admin-support-list">
                {requests.map((request) => (
                  <article className="admin-support-item" key={request.id}>
                    <div className="admin-ops-item-heading"><strong>{request.subject}</strong><Chip size="small" label={request.status.replace('_', ' ')} /></div>
                    <p>{request.category.replace('-', ' ')} • {new Date(request.createdAt).toLocaleString()}</p>
                    <p>{request.message}</p>
                    <TextField label="Response visible to candidate" value={responses[request.id] ?? request.adminResponse} onChange={(event) => setResponses((current) => ({ ...current, [request.id]: event.target.value }))} fullWidth multiline minRows={2} />
                    <div className="admin-actions">
                      <Button disabled={busy} onClick={() => void updateRequest(request, 'in_progress')}>Mark in progress</Button>
                      <Button disabled={busy} variant="contained" onClick={() => void updateRequest(request, 'resolved')}>Resolve and respond</Button>
                    </div>
                  </article>
                ))}
                {!requests.length && <p>No support requests have been submitted.</p>}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Box>
  )
}
