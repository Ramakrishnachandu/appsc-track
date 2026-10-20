import { useEffect, useState } from 'react'
import { Alert, Box, Button, Card, CardContent, Chip } from '@mui/material'
import { getAdminContent, type AdminContentItem } from '../lib/adminContentApi'

const httpsHref = (value: string) => {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' ? url.href : null
  } catch {
    return null
  }
}

export function ResourcesPage() {
  const [items, setItems] = useState<AdminContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)

  useEffect(() => {
    let active = true
    void getAdminContent({ includeUnpublished: false })
      .then((content) => {
        if (active) setItems(content)
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Unable to load shared resources.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [reload])

  const notices = items.filter((item) => item.kind === 'notice')
  const resources = items.filter((item) => item.kind === 'resource')

  return (
    <Box className="page-shell">
      <div className="study-plan-intro">
        <div>
          <span className="subject-detail-badge">CANDIDATE LIBRARY</span>
          <h1>Notices & resources</h1>
          <p>Published announcements and curated study links with source attribution.</p>
        </div>
      </div>
      {error && <Alert severity="error" action={<Button color="inherit" onClick={() => { setLoading(true); setError(''); setReload((value) => value + 1) }}>Retry</Button>}>{error}</Alert>}
      {loading && <Alert severity="info">Loading published content…</Alert>}
      <Alert severity="info">Use the linked issuing organization or source to verify dates and requirements. APPSC Track does not independently certify linked material.</Alert>
      <section className="candidate-library-section">
        <h2>Official notices</h2>
        <div className="candidate-library-grid">
          {notices.map((item) => {
            const sourceUrl = httpsHref(item.sourceUrl)
            return <Card className="candidate-library-card" key={item.id}>
              <CardContent>
                <Chip size="small" label={typeof item.content.category === 'string' && item.content.category ? item.content.category : 'Notice'} />
                <h3>{item.title}</h3>
                <p>{typeof item.content.summary === 'string' ? item.content.summary : ''}</p>
                <small>{item.sourceTitle}{item.sourcePublishedAt ? ` • ${item.sourcePublishedAt}` : ''}</small>
                {sourceUrl && <Button component="a" href={sourceUrl} target="_blank" rel="noreferrer" variant="outlined" sx={{ mt: 2 }}>View source notice</Button>}
              </CardContent>
            </Card>
          })}
          {!loading && !error && notices.length === 0 && <p className="planner-empty-inline">There are no published notices yet.</p>}
        </div>
      </section>
      <section className="candidate-library-section">
        <h2>Curated resources</h2>
        <div className="candidate-library-grid">
          {resources.map((item) => {
            const resourceUrl = httpsHref(typeof item.content.resourceUrl === 'string' ? item.content.resourceUrl : item.sourceUrl)
            return <Card className="candidate-library-card" key={item.id}>
              <CardContent>
                <Chip size="small" label={typeof item.content.category === 'string' && item.content.category ? item.content.category : 'Study resource'} />
                <h3>{item.title}</h3>
                <p>{typeof item.content.summary === 'string' ? item.content.summary : ''}</p>
                <small>Source: {item.sourceTitle}{item.sourcePublishedAt ? ` • ${item.sourcePublishedAt}` : ''}</small>
                {resourceUrl && <Button component="a" href={resourceUrl} target="_blank" rel="noreferrer" variant="outlined" sx={{ mt: 2 }}>Open resource</Button>}
              </CardContent>
            </Card>
          })}
          {!loading && !error && resources.length === 0 && <p className="planner-empty-inline">There are no published resources yet.</p>}
        </div>
      </section>
    </Box>
  )
}
