import { useEffect, useState } from 'react'
import { Alert, Box, Button, CircularProgress, LinearProgress, MenuItem, TextField, ToggleButton, ToggleButtonGroup } from '@mui/material'
import { Bookmark } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { ADMIN_SYLLABUS_TARGETS, APPSC_GROUP_II_SOURCES, getCurrentGroup2Syllabus, GROUP_II_SCHEME_NOTICE } from '../data/group2Syllabus'
import { hydrateSyllabusConfigFromSupabase, type SyllabusConfig } from '../data/dashboardData'
import { getTopicProgress } from '../lib/studyPlanner'
import { useStudyPlanStore } from '../store/useStudyPlanStore'
import type { TopicStatus } from '../types/studyPlanner'

const statusLabels: Record<TopicStatus, string> = {
  'not-started': 'Not started',
  'in-progress': 'In progress',
  completed: 'Completed',
  'needs-revision': 'Needs revision',
}

export function SubjectsPage() {
  const navigate = useNavigate()
  const plan = useStudyPlanStore((state) => state.plan)
  const loading = useStudyPlanStore((state) => state.loading)
  const error = useStudyPlanStore((state) => state.error)
  const loadForUser = useStudyPlanStore((state) => state.loadForUser)
  const userId = useStudyPlanStore((state) => state.userId)
  const [selectedPaperId, setSelectedPaperId] = useState(getCurrentGroup2Syllabus()[0]?.id ?? '')
  const [statusFilter, setStatusFilter] = useState<'all' | TopicStatus>('all')
  const [search, setSearch] = useState('')
  const [adminContent, setAdminContent] = useState<SyllabusConfig | null>(null)
  const syllabus = getCurrentGroup2Syllabus()
  const paper = syllabus.find((item) => item.id === selectedPaperId) ?? syllabus[0]

  useEffect(() => {
    let isMounted = true
    void hydrateSyllabusConfigFromSupabase().then((config) => {
      if (isMounted && window.localStorage.getItem('appsc_syllabus_config')) {
        setAdminContent(config)
      }
    })
    return () => { isMounted = false }
  }, [])

  if (loading) {
    return <Box className="page-shell planner-loading"><CircularProgress aria-label="Loading syllabus progress" /></Box>
  }

  if (!plan) {
    return (
      <Box className="page-shell">
        <Alert severity="error">{error ?? 'Your syllabus progress is not available yet.'}</Alert>
        <Button variant="outlined" onClick={() => userId && void loadForUser(userId)} disabled={!userId}>
          Retry loading syllabus
        </Button>
      </Box>
    )
  }

  if (!paper) {
    return <Box className="page-shell"><Alert severity="error">The syllabus is currently unavailable.</Alert></Box>
  }

  const topics = paper.subjects.flatMap((subject) => subject.units.flatMap((unit) => unit.topics))
  const visibleTopicIds = new Set(topics.filter((topic) => {
    const matchesSearch = !search || `${topic.title} ${topic.subtopics.join(' ')} ${topic.learningObjectives.join(' ')}`.toLowerCase().includes(search.toLowerCase())
    const status = getTopicProgress(plan, topic.id)?.status ?? 'not-started'
    return matchesSearch && (statusFilter === 'all' || status === statusFilter)
  }).map((topic) => topic.id))
  const completedCount = topics.filter((topic) => getTopicProgress(plan, topic.id)?.status === 'completed').length
  const progressPercent = topics.length ? Math.round((completedCount / topics.length) * 100) : 0
  const adminSubjects = adminContent ? [...adminContent.prelimsSubjects, ...adminContent.mainsSubjects] : []
  const unmappedAdminSubjects = adminSubjects.filter((adminSubject) => !ADMIN_SYLLABUS_TARGETS[adminSubject.id])

  return (
    <Box className="page-shell syllabus-page">
      <div className="syllabus-page-heading">
        <div>
          <span className="subject-detail-badge">APPSC GROUP II</span>
          <h1>Syllabus map</h1>
          <p>Track each topic against the current linked syllabus and your preparation notes.</p>
        </div>
        <div className="syllabus-progress-summary">
          <strong>{progressPercent}%</strong>
          <span>{completedCount} / {topics.length} topics complete in this paper</span>
        </div>
      </div>

      <div className="syllabus-sources">
        <p>{GROUP_II_SCHEME_NOTICE}</p>
        {APPSC_GROUP_II_SOURCES.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label}</a>)}
        <p>Paper, subject, and screening-section order follows Notification 37/2026. Ordered Admin syllabus entries below are the topics used for progress tracking.</p>
      </div>

      <div className="syllabus-toolbar">
        <ToggleButtonGroup className="syllabus-paper-selector" value={paper.id} exclusive aria-label="Syllabus paper" onChange={(_event, value: string | null) => { if (value) setSelectedPaperId(value) }}>
          {syllabus.map((item) => <ToggleButton key={item.id} value={item.id}>{item.title}</ToggleButton>)}
        </ToggleButtonGroup>
        <div className="syllabus-filters">
          <TextField label="Find a topic" value={search} onChange={(event) => setSearch(event.target.value)} size="small" />
          <TextField select label="Status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'all' | TopicStatus)} size="small">
            <MenuItem value="all">All statuses</MenuItem>
            <MenuItem value="not-started">Not started</MenuItem>
            <MenuItem value="in-progress">In progress</MenuItem>
            <MenuItem value="needs-revision">Needs revision</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
          </TextField>
        </div>
      </div>

      <div className="syllabus-paper-heading">
        <div>
          <span className={paper.source === 'official-heading' ? 'syllabus-source-tag official' : 'syllabus-source-tag suggested'}>
            {paper.source === 'official-heading' ? 'APPSC heading' : 'Suggested structure'}
          </span>
          <h2>{paper.title}</h2>
        </div>
        <span>
          {paper.scheme.questionCount} questions / {paper.scheme.durationMinutes} min / {paper.scheme.maximumMarks} marks / {paper.scheme.negativeMarking.numerator}/{paper.scheme.negativeMarking.denominator} penalty per wrong answer / {topics.length} study topics
        </span>
      </div>

      <div className="syllabus-subject-list">
        {paper.subjects.map((subject) => (
          <section className="syllabus-subject" key={subject.id}>
            <div className="syllabus-subject-heading">
              <div>
                <span className={subject.source === 'official-heading' ? 'syllabus-source-tag official' : 'syllabus-source-tag suggested'}>
                  {subject.source === 'official-heading' ? 'Subject heading' : 'Suggested grouping'}
                </span>
                <h3>{subject.title}</h3>
              </div>
              <span>{subject.marks ? `${subject.marks} marks / ` : ''}{subject.units.reduce((sum, unit) => sum + unit.topics.length, 0)} topics</span>
            </div>
            {subject.units.map((unit) => {
              const unitTopics = unit.topics.filter((topic) => visibleTopicIds.has(topic.id))
              if (!unitTopics.length) return null
              const topicRows = unitTopics.map((topic) => {
                const progress = getTopicProgress(plan, topic.id)
                return (
                  <article className="syllabus-topic-row" key={topic.id}>
                    <div className="syllabus-topic-copy">
                      <div className="syllabus-topic-title-row">
                        <h5>{topic.title}</h5>
                        <span className={topic.source === 'admin-reference' ? 'syllabus-source-tag admin-reference' : topic.source === 'official-heading' ? 'syllabus-source-tag official' : 'syllabus-source-tag suggested'}>
                          {topic.source === 'admin-reference' ? 'Admin syllabus entry' : topic.source === 'official-heading' ? 'Official' : 'Suggested detail'}
                        </span>
                      </div>
                      {topic.learningObjectives[0] && <p>{topic.learningObjectives[0]}</p>}
                      {topic.subtopics.length > 0 && (
                        <div className="syllabus-subtopic-list" aria-label="Suggested subtopics">
                          {topic.subtopics.map((subtopic) => <span key={subtopic}>{subtopic}</span>)}
                        </div>
                      )}
                      <div className="syllabus-topic-meta">
                        <span>{topic.estimatedMinutes} min</span>
                        <span>{topic.difficulty}</span>
                        <span>{topic.priority} priority</span>
                        {progress?.bookmarked && <Bookmark fontSize="small" aria-label="Bookmarked" />}
                      </div>
                    </div>
                    <div className="syllabus-topic-progress">
                      <span>{statusLabels[progress?.status ?? 'not-started']}</span>
                      <strong>{progress?.completionPercent ?? 0}%</strong>
                      <LinearProgress variant="determinate" value={progress?.completionPercent ?? 0} />
                    </div>
                    <Button size="small" onClick={() => navigate(`/study-plan?topic=${encodeURIComponent(topic.id)}`)}>Study</Button>
                  </article>
                )
              })
              return (
                <div className="syllabus-unit" key={unit.id}>
                  <div className="syllabus-unit-heading">
                    <h4>{unit.title}</h4>
                    <span className={unit.source === 'admin-reference' ? 'syllabus-source-tag admin-reference' : unit.source === 'official-heading' ? 'syllabus-source-tag official' : 'syllabus-source-tag suggested'}>
                      {unit.source === 'admin-reference' ? 'Admin topic order' : unit.source === 'official-heading' ? 'APPSC section' : 'Suggested organization'}
                    </span>
                  </div>
                  <div className="syllabus-topic-list">{topicRows}</div>
                </div>
              )
            })}
          </section>
        ))}
        {!visibleTopicIds.size && <div className="planner-empty-state"><strong>No topics match these filters.</strong><span>Change the search or status filter.</span></div>}
      </div>

      {unmappedAdminSubjects.length > 0 && (
        <section className="admin-syllabus-supplement">
          <div className="syllabus-paper-heading">
            <div>
              <span className="syllabus-source-tag suggested">Mapping required</span>
              <h2>Unmapped Admin content</h2>
            </div>
            <span>Not assigned to a verified paper or section</span>
          </div>
          {unmappedAdminSubjects.map((subject) => (
            <details key={subject.id} className="admin-syllabus-item">
              <summary>{subject.name}<span>{subject.topics.length} references</span></summary>
              <p>{subject.summary}</p>
              <ul>{subject.topics.map((topic) => <li key={topic}>{topic}</li>)}</ul>
            </details>
          ))}
        </section>
      )}
    </Box>
  )
}
