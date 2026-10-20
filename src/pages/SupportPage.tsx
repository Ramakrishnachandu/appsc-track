import { useEffect, useState } from 'react'
import { Alert, Box, Button, Card, CardContent, MenuItem, TextField } from '@mui/material'
import {
  getSupportRequests,
  submitSupportRequest,
  type SupportCategory,
  type SupportRequest,
} from '../lib/adminContentApi'
import { useAppStore } from '../store/useAppStore'

export function SupportPage() {
  const user = useAppStore((state) => state.user)
  const userId = user?.id
  const [requests, setRequests] = useState<SupportRequest[]>([])
  const [category, setCategory] = useState<SupportCategory>('technical')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [feedback, setFeedback] = useState<{ text: string; severity: 'success' | 'error' } | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    let active = true
    if (!userId) return () => { active = false }
    void getSupportRequests(userId, false)
      .then((loadedRequests) => {
        if (active) setRequests(loadedRequests)
      })
      .catch((error: unknown) => {
        if (active) setFeedback({ text: error instanceof Error ? error.message : 'Unable to load your support requests.', severity: 'error' })
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [reload, userId])

  const submit = async () => {
    if (!userId) return
    if (subject.trim().length < 4 || message.trim().length < 10) {
      setFeedback({ text: 'Add a subject of at least 4 characters and a message of at least 10 characters.', severity: 'error' })
      return
    }
    setSaving(true)
    try {
      await submitSupportRequest({ userId, category, subject: subject.trim(), message: message.trim() })
      setSubject('')
      setMessage('')
      setFeedback({ text: 'Your request was submitted. You can track its status below.', severity: 'success' })
      try {
        setRequests(await getSupportRequests(userId, false))
      } catch (refreshError) {
        setFeedback({
          text: `Your request was submitted, but the request list could not be refreshed: ${refreshError instanceof Error ? refreshError.message : 'unknown error'}`,
          severity: 'error',
        })
      }
    } catch (error) {
      setFeedback({ text: error instanceof Error ? error.message : 'Unable to submit your request.', severity: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Box className="page-shell">
      <div className="study-plan-intro">
        <div><span className="subject-detail-badge">HELP & SUPPORT</span><h1>Contact support</h1><p>Report an account, study-data, content, or technical issue. Only support staff can view and respond to your request.</p></div>
      </div>
      {feedback && <Alert severity={feedback.severity} onClose={() => setFeedback(null)} action={feedback.severity === 'error' ? <Button color="inherit" onClick={() => { setLoading(true); setFeedback(null); setReload((value) => value + 1) }}>Retry</Button> : undefined} sx={{ mb: 2 }}>{feedback.text}</Alert>}
      <div className="support-page-grid">
        <Card className="panel-card"><CardContent>
          <h2>New request</h2>
          <TextField select label="Category" value={category} onChange={(event) => setCategory(event.target.value as SupportCategory)} fullWidth margin="normal">
            <MenuItem value="account">Account access</MenuItem>
            <MenuItem value="study-data">Study plan or saved data</MenuItem>
            <MenuItem value="content">Content correction</MenuItem>
            <MenuItem value="technical">Technical issue</MenuItem>
            <MenuItem value="other">Other</MenuItem>
          </TextField>
          <TextField label="Subject" value={subject} onChange={(event) => setSubject(event.target.value)} fullWidth margin="normal" slotProps={{ htmlInput: { maxLength: 120 } }} />
          <TextField label="Describe the issue (do not include passwords)" value={message} onChange={(event) => setMessage(event.target.value)} fullWidth multiline minRows={5} margin="normal" slotProps={{ htmlInput: { maxLength: 3000 } }} />
          <Button variant="contained" onClick={() => void submit()} disabled={saving}>{saving ? 'Submitting…' : 'Submit request'}</Button>
        </CardContent></Card>
        <section className="support-request-list">
          <h2>Your requests</h2>
          {loading && <Alert severity="info">Loading requests…</Alert>}
          {!loading && requests.map((request) => (
            <Card className="support-request-card" key={request.id}><CardContent>
              <div className="admin-ops-item-heading"><strong>{request.subject}</strong><span>{request.status.replace('_', ' ')}</span></div>
              <small>{request.category.replace('-', ' ')} • {new Date(request.createdAt).toLocaleString()}</small>
              <p>{request.message}</p>
              {request.adminResponse && <Alert severity="info"><strong>Support response:</strong> {request.adminResponse}</Alert>}
            </CardContent></Card>
          ))}
          {!loading && requests.length === 0 && <p className="planner-empty-inline">You have not submitted any support requests.</p>}
        </section>
      </div>
    </Box>
  )
}
