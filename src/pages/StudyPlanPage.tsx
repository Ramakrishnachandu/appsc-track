import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  IconButton,
  LinearProgress,
  MenuItem,
  Rating,
  Radio,
  RadioGroup,
  Slider,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from '@mui/material'
import { Bookmark, BookmarkBorder, CheckCircleOutlined, Pause, PlayArrow, Stop } from '@mui/icons-material'
import { useLocation } from 'react-router-dom'
import { APPSC_GROUP_II_SOURCES, getCurrentGroup2Syllabus, GROUP_II_SCHEME_NOTICE, getAllSyllabusTopics } from '../data/group2Syllabus'
import { getTopicPracticeQuestions } from '../data/topicPracticeQuestions'
import {
  addDaysToDateKey,
  addPlanSession,
  checkpointStudyTimer,
  commitTimerToPlan,
  completePlanSession,
  createPlanWithSettings,
  createStudyTimer,
  getDailyStudyTotals,
  getElapsedTimerSeconds,
  getLocalDateKey,
  getPlanPeriodRange,
  getRevisionSessions,
  getSessionsInPeriod,
  getStudyRecommendation,
  getSuggestedRescheduleDate,
  getTopicById,
  getTopicProgress,
  pauseStudyTimer,
  recordTopicQuizAnswer,
  reschedulePlanSession,
  resumeStudyTimer,
  setTopicCompleted,
  skipPlanSession,
  updateTopicProgress,
  WEEKDAY_LABELS,
} from '../lib/studyPlanner'
import { isSupabaseConfigured } from '../lib/supabase'
import { useAppStore } from '../store/useAppStore'
import { useStudyPlanStore } from '../store/useStudyPlanStore'
import type { PreparationLevel, StudyMedium, StudyPlanData, StudyPlanPeriod, StudyPlanSettings, SyllabusTopic } from '../types/studyPlanner'

const statusLabels: Record<string, string> = {
  'not-started': 'Not started',
  'in-progress': 'In progress',
  completed: 'Completed',
  'needs-revision': 'Needs revision',
}

const sessionTypeLabels = { learn: 'Learn', revision: 'Revision', practice: 'Practice' } as const

const formatMinutes = (minutes: number) => {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours && rest) return `${hours}h ${rest}m`
  if (hours) return `${hours}h`
  return `${rest}m`
}

const formatClock = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainder = seconds % 60
  return [hours, minutes, remainder].map((part) => String(part).padStart(2, '0')).join(':')
}

const formatPlanDate = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString('en-IN', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
})

const getTopicContext = (topicId: string) => {
  for (const paper of getCurrentGroup2Syllabus()) {
    for (const subject of paper.subjects) {
      for (const unit of subject.units) {
        if (unit.topics.some((topic) => topic.id === topicId)) {
          return { paper, subject, unit }
        }
      }
    }
  }
  return null
}

function StudyPlanSettingsForm({ settings, onApply, saving }: {
  settings: StudyPlanSettings
  onApply: (next: StudyPlanSettings) => void
  saving: boolean
}) {
  const [draft, setDraft] = useState(settings)
  const today = getLocalDateKey()
  const availableDayCount = draft.dayAvailability.filter((hours) => hours > 0).length

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!availableDayCount) return
    const dayAvailability = draft.dayAvailability.map((hours) => Math.min(16, Math.max(0, Number(hours) || 0)))
    onApply({
      ...draft,
      dayAvailability,
      dailyHours: Number((dayAvailability.reduce((sum, hours) => sum + hours, 0) / availableDayCount).toFixed(1)),
      startDate: today,
      targetDate: draft.targetDate && draft.targetDate >= today ? draft.targetDate : null,
    })
  }

  return (
    <form className="planner-settings" onSubmit={handleSubmit}>
      <div className="planner-section-heading">
        <div>
          <span className="subject-detail-badge">Personalize</span>
          <h2>Study schedule</h2>
        </div>
        <p>Changing your schedule preserves completed sessions and reschedules the remaining topics.</p>
      </div>
      <div className="planner-settings-grid">
        <TextField
          select
          label="Preparation level"
          value={draft.level}
          onChange={(event) => setDraft((current) => ({ ...current, level: event.target.value as PreparationLevel }))}
        >
          <MenuItem value="beginner">Beginner</MenuItem>
          <MenuItem value="intermediate">Intermediate</MenuItem>
          <MenuItem value="advanced">Advanced</MenuItem>
        </TextField>
        <TextField
          select
          label="Preferred study medium"
          value={draft.medium}
          onChange={(event) => setDraft((current) => ({ ...current, medium: event.target.value as StudyMedium }))}
        >
          <MenuItem value="english">English</MenuItem>
          <MenuItem value="telugu">Telugu</MenuItem>
          <MenuItem value="bilingual">Telugu + English</MenuItem>
        </TextField>
        <TextField
          label="Target date (optional)"
          type="date"
          value={draft.targetDate ?? ''}
          onChange={(event) => setDraft((current) => ({ ...current, targetDate: event.target.value || null }))}
          slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: today } }}
        />
      </div>
      <fieldset className="planner-availability">
        <legend>Weekly availability</legend>
        <p>Select at least one study day. Each selected day needs 0.5 to 16 hours.</p>
        <div className="planner-availability-grid">
          {WEEKDAY_LABELS.map((day, dayIndex) => {
            const hours = draft.dayAvailability[dayIndex] ?? 0
            return (
              <div className={hours > 0 ? 'planner-availability-row available' : 'planner-availability-row'} key={day}>
                <label>
                  <Checkbox
                    checked={hours > 0}
                    onChange={(_event, checked) => setDraft((current) => ({
                      ...current,
                      dayAvailability: current.dayAvailability.map((value, index) => index === dayIndex
                        ? checked ? Math.min(16, Math.max(0.5, current.dailyHours || 4)) : 0
                        : value),
                    }))}
                    slotProps={{ input: { 'aria-label': `Study on ${day}` } }}
                    size="small"
                  />
                  <span>{day}</span>
                </label>
                {hours > 0 ? (
                  <TextField
                    label={`${day} hours`}
                    type="number"
                    size="small"
                    required
                    value={hours}
                    onChange={(event) => {
                      const nextHours = Number(event.target.value)
                      setDraft((current) => ({
                        ...current,
                        dayAvailability: current.dayAvailability.map((value, index) => index === dayIndex
                          ? Math.min(16, Math.max(0.5, nextHours || 0.5))
                          : value),
                      }))
                    }}
                    slotProps={{ htmlInput: { min: 0.5, max: 16, step: 0.5 } }}
                  />
                ) : <span className="planner-day-off">Rest day</span>}
              </div>
            )
          })}
        </div>
        <div className="planner-availability-summary">
          {availableDayCount} study days · {draft.dayAvailability.reduce((sum, hours) => sum + hours, 0)} hours per week
        </div>
      </fieldset>
      <p className="planner-settings-note">The preferred medium is saved with your plan. Planner labels and catalog text currently remain in English; this selection does not translate content.</p>
      <Button type="submit" variant="contained" disabled={saving || !availableDayCount}>Recalculate plan</Button>
    </form>
  )
}

function StudyTopicPanel({ topic, plan, onUpdate, onComplete }: {
  topic: SyllabusTopic
  plan: StudyPlanData
  onUpdate: (changes: Parameters<typeof updateTopicProgress>[2]) => void
  onComplete: () => void
}) {
  const progress = getTopicProgress(plan, topic.id)
  const location = getTopicContext(topic.id)
  const questions = getTopicPracticeQuestions(topic.id)
  const [notesDraft, setNotesDraft] = useState(progress?.notes ?? '')
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [checkedQuestions, setCheckedQuestions] = useState<Record<string, boolean>>({})
  const topicAttempts = plan.quizAttempts.filter((attempt) => attempt.topicId === topic.id)
  const accuracy = topicAttempts.length
    ? Math.round((topicAttempts.filter((attempt) => attempt.correct).length / topicAttempts.length) * 100)
    : null

  if (!progress) return null

  const handleStatusChange = (status: typeof progress.status) => {
    if (status === 'completed') {
      onComplete()
      return
    }
    onUpdate({ status, completionPercent: status === 'not-started' ? 0 : progress.completionPercent })
  }

  return (
    <section className="topic-inspector" aria-labelledby="topic-inspector-title">
      <div className="topic-inspector-heading">
        <div>
          <span className="subject-detail-badge">{location?.paper.title ?? 'Syllabus topic'}</span>
          <h2 id="topic-inspector-title">{topic.title}</h2>
          {location && <p>{location.subject.title} / {location.unit.title}</p>}
        </div>
        <Tooltip title={progress.bookmarked ? 'Remove bookmark' : 'Bookmark topic'}>
          <IconButton
            aria-label={progress.bookmarked ? 'Remove bookmark' : 'Bookmark topic'}
            onClick={() => onUpdate({ bookmarked: !progress.bookmarked })}
          >
            {progress.bookmarked ? <Bookmark /> : <BookmarkBorder />}
          </IconButton>
        </Tooltip>
      </div>

      <div className="topic-status-grid">
        <TextField
          select
          label="Status"
          value={progress.status}
          onChange={(event) => handleStatusChange(event.target.value as typeof progress.status)}
        >
          {Object.entries(statusLabels).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
        </TextField>
        <TextField
          select
          label="Difficulty"
          value={progress.difficulty}
          onChange={(event) => onUpdate({ difficulty: event.target.value as typeof progress.difficulty })}
        >
          <MenuItem value="easy">Easy</MenuItem>
          <MenuItem value="moderate">Moderate</MenuItem>
          <MenuItem value="challenging">Challenging</MenuItem>
        </TextField>
        <TextField
          select
          label="Priority"
          value={progress.priority}
          onChange={(event) => onUpdate({ priority: event.target.value as typeof progress.priority })}
        >
          <MenuItem value="high">High</MenuItem>
          <MenuItem value="medium">Medium</MenuItem>
          <MenuItem value="low">Low</MenuItem>
        </TextField>
      </div>

      <div className="topic-progress-control">
        <div className="topic-progress-label"><span>Topic completion</span><strong>{progress.completionPercent}%</strong></div>
        <Slider
          aria-label="Topic completion percentage"
          value={progress.completionPercent}
          min={0}
          max={100}
          step={5}
          valueLabelDisplay="auto"
          onChangeCommitted={(_event, value) => {
            const completionPercent = Array.isArray(value) ? value[0] : value
            if (completionPercent === 100) {
              onComplete()
              return
            }
            onUpdate({
              completionPercent,
              status: completionPercent === 0 ? 'not-started' : 'in-progress',
            })
          }}
        />
      </div>

      <div className="topic-objectives">
        {topic.learningObjectives.length > 0 && <><h3>Learning objective</h3><ul>{topic.learningObjectives.map((objective) => <li key={objective}>{objective}</li>)}</ul></>}
        {topic.subtopics.length > 0 && <><h3>Subtopics</h3><ul>{topic.subtopics.map((subtopic) => <li key={subtopic}>{subtopic}</li>)}</ul></>}
        <div className="topic-meta-line">
          <span>Estimated {formatMinutes(topic.estimatedMinutes)}</span>
          <span>{Math.floor(progress.actualSeconds / 60)} min recorded</span>
          {accuracy !== null && <span>Practice accuracy {accuracy}%</span>}
        </div>
      </div>

      <div className="topic-confidence-row">
        <div>
          <h3>Confidence after study</h3>
          <p>Rate recall from 1 (low) to 5 (strong).</p>
        </div>
        <Rating
          name={`confidence-${topic.id}`}
          value={progress.confidence}
          max={5}
          onChange={(_event, value) => onUpdate({ confidence: value })}
          getLabelText={(value) => `${value} out of 5 confidence`}
        />
      </div>

      <div className="topic-note-editor">
        <TextField
          label="Study notes and important facts"
          value={notesDraft}
          onChange={(event) => setNotesDraft(event.target.value)}
          fullWidth
          multiline
          minRows={3}
          maxRows={8}
        />
        <Button variant="outlined" onClick={() => onUpdate({ notes: notesDraft })} disabled={notesDraft === progress.notes}>Save notes</Button>
      </div>

      <div className="topic-quiz-section">
        <div className="planner-section-heading">
          <div>
            <span className="subject-detail-badge">Curated practice</span>
            <h3>Quick check</h3>
          </div>
          <span>{topicAttempts.length} answers saved</span>
        </div>
        {questions.length ? questions.map((question) => {
          const isChecked = Boolean(checkedQuestions[question.id])
          const selectedIndex = answers[question.id]
          const selectedCorrect = selectedIndex === question.correctIndex
          return (
            <div key={question.id} className="topic-question">
              <p>{question.prompt}</p>
              <RadioGroup
                aria-label={question.prompt}
                value={selectedIndex ?? ''}
                onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: Number(event.target.value) }))}
              >
                {question.options.map((option, index) => (
                  <FormControlLabel key={option} value={index} control={<Radio size="small" />} label={option} disabled={isChecked} />
                ))}
              </RadioGroup>
              {isChecked ? (
                <Alert severity={selectedCorrect ? 'success' : 'info'}>
                  {selectedCorrect ? 'Correct.' : 'Review this one.'} {question.explanation}
                </Alert>
              ) : (
                <Button
                  size="small"
                  variant="outlined"
                  disabled={selectedIndex === undefined}
                  onClick={() => {
                    const correct = selectedIndex === question.correctIndex
                    setCheckedQuestions((current) => ({ ...current, [question.id]: true }))
                    void useStudyPlanStore.getState().updatePlan((current) => recordTopicQuizAnswer(current, {
                        id: `answer-${Date.now()}-${question.id}`,
                        topicId: topic.id,
                        questionId: question.id,
                        selectedIndex,
                        correct,
                        attemptedAt: new Date().toISOString(),
                      }))
                  }}
                >
                  Check answer
                </Button>
              )}
            </div>
          )
        }) : (
          <p className="planner-empty-inline">No curated practice item is available for this topic yet. Topic completion and confidence tracking remain available.</p>
        )}
        <p className="topic-source-note">These are original practice items, not previous-year questions or official APPSC questions.</p>
      </div>

      <Button variant="contained" color="success" startIcon={<CheckCircleOutlined />} onClick={onComplete} disabled={progress.status === 'completed'}>
        Mark topic complete
      </Button>
    </section>
  )
}

export function StudyPlanPage() {
  const { user } = useAppStore()
  const plan = useStudyPlanStore((state) => state.plan)
  const loading = useStudyPlanStore((state) => state.loading)
  const saving = useStudyPlanStore((state) => state.saving)
  const error = useStudyPlanStore((state) => state.error)
  const updatePlan = useStudyPlanStore((state) => state.updatePlan)
  const loadForUser = useStudyPlanStore((state) => state.loadForUser)
  const pageLocation = useLocation()
  const [period, setPeriod] = useState<StudyPlanPeriod>('today')
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(() => new URLSearchParams(pageLocation.search).get('topic'))
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [paperFilter, setPaperFilter] = useState('all')
  const [rescheduleDate, setRescheduleDate] = useState(addDaysToDateKey(getLocalDateKey(), 1))
  const [now, setNow] = useState(0)
  const today = getLocalDateKey()

  useEffect(() => {
    if (plan?.activeTimer?.status !== 'running') return
    const interval = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(interval)
  }, [plan?.activeTimer?.startedAt, plan?.activeTimer?.status])

  useEffect(() => {
    if (plan?.activeTimer?.status !== 'running') return
    const interval = window.setInterval(() => {
      void updatePlan((current) => {
        if (current.activeTimer?.status !== 'running') return current
        return {
          ...current,
          activeTimer: checkpointStudyTimer(current.activeTimer),
          updatedAt: new Date().toISOString(),
        }
      })
    }, 10000)
    return () => window.clearInterval(interval)
  }, [plan?.activeTimer?.sessionId, plan?.activeTimer?.status, updatePlan])

  if (loading) {
    return <Box className="page-shell planner-loading"><CircularProgress aria-label="Loading study plan" /></Box>
  }

  if (!plan) {
    return (
      <Box className="page-shell">
        <Alert severity="error">{error ?? 'Your study plan is not available yet.'}</Alert>
        <Button variant="outlined" onClick={() => user?.id && void loadForUser(user.id)} disabled={!user?.id}>Retry loading study plan</Button>
      </Box>
    )
  }

  const range = getPlanPeriodRange(period, today)
  const filteredSessions = getSessionsInPeriod(plan.sessions, period, today).filter((session) => {
    if (paperFilter === 'all') return true
    return getTopicContext(session.topicId)?.paper.id === paperFilter
  })
  const overdueSessions = plan.sessions
    .filter((session) => session.status === 'planned' && session.date < today)
    .filter((session) => paperFilter === 'all' || getTopicContext(session.topicId)?.paper.id === paperFilter)
    .sort((first, second) => first.date.localeCompare(second.date))
  const recommendation = getStudyRecommendation(plan, today)
  const upcomingSession = recommendation?.session ?? null
  const selectedSession = filteredSessions.find((session) => session.id === selectedSessionId)
    ?? (selectedTopicId ? filteredSessions.find((session) => session.topicId === selectedTopicId) : null)
  const effectiveTopicId = selectedTopicId ?? selectedSession?.topicId ?? upcomingSession?.topicId ?? null
  const selectedTopic = effectiveTopicId ? getTopicById(effectiveTopicId) : undefined
  const totalTopics = getAllSyllabusTopics().length
  const completedTopics = plan.topicProgress.filter((progress) => progress.status === 'completed').length
  const overallPercent = totalTopics ? Math.round((completedTopics / totalTopics) * 100) : 0
  const periodSessions = getSessionsInPeriod(plan.sessions, period, today)
  const periodPlannedMinutes = periodSessions.filter((session) => session.status !== 'skipped').reduce((sum, session) => sum + session.plannedMinutes, 0)
  const periodActualSeconds = periodSessions.reduce((sum, session) => sum + (session.actualSeconds ?? 0), 0)
  const dueRevisions = getRevisionSessions(plan, today).filter((session) => session.date <= today).length
  const dailyTotals = getDailyStudyTotals(plan, today)
  const activeTimer = plan.activeTimer
  const timerSeconds = activeTimer ? getElapsedTimerSeconds(activeTimer, now) : 0
  const projectedFinish = plan.sessions
    .filter((session) => (session.status === 'planned' || session.status === 'in-progress') && session.kind === 'learn')
    .reduce<string | null>((latest, session) => !latest || session.date > latest ? session.date : latest, null)
  const targetOverrunDays = plan.settings.targetDate && projectedFinish && projectedFinish > plan.settings.targetDate
    ? Math.ceil((new Date(`${projectedFinish}T12:00:00`).getTime() - new Date(`${plan.settings.targetDate}T12:00:00`).getTime()) / 86400000)
    : 0

  const startSession = (sessionId: string, topicId: string) => {
    void updatePlan((current) => ({
      ...current,
      activeTimer: createStudyTimer(sessionId, topicId),
      sessions: current.sessions.map((session) => session.id === sessionId
        ? { ...session, status: 'in-progress' }
        : session),
      updatedAt: new Date().toISOString(),
    }))
  }

  const handleSessionComplete = (sessionId: string) => {
    void updatePlan((current) => completePlanSession(current, sessionId))
  }

  const handleTopicComplete = (topicId: string) => {
    void updatePlan((current) => {
      const withTimerRecorded = current.activeTimer?.topicId === topicId
        ? commitTimerToPlan(current, current.activeTimer)
        : current
      return setTopicCompleted(withTimerRecorded, topicId)
    })
  }

  const handleContinue = () => {
    if (!upcomingSession) return
    setSelectedSessionId(upcomingSession.id)
    setSelectedTopicId(upcomingSession.topicId)
  }

  const handleRecalculate = (settings: StudyPlanSettings) => {
    void updatePlan((current) => createPlanWithSettings(current, settings, today))
  }

  const handleReschedule = () => {
    if (!selectedSession) return
    void updatePlan((current) => reschedulePlanSession(current, selectedSession.id, rescheduleDate))
    setSelectedSessionId(null)
  }

  const timerActions = () => {
    if (!activeTimer) return null
    const timerSession = plan.sessions.find((session) => session.id === activeTimer.sessionId)
    return (
      <div className="focus-timer-panel" aria-live="polite">
        <div>
          <span className="subject-detail-badge">{activeTimer.status === 'interrupted' ? 'Interrupted session' : 'Study timer'}</span>
          <strong>{getTopicById(activeTimer.topicId)?.title ?? 'Study session'}</strong>
        </div>
        <output className="focus-timer-clock" aria-label="Elapsed study time">{formatClock(timerSeconds)}</output>
        {activeTimer.status === 'interrupted' && <span className="focus-interruption-note">Recovered from interruption. Time since the last saved checkpoint was not counted.</span>}
        <div className="focus-timer-actions">
          {activeTimer.status === 'running' ? (
            <Button size="small" startIcon={<Pause />} onClick={() => void updatePlan((current) => ({
              ...current,
              activeTimer: current.activeTimer ? pauseStudyTimer(current.activeTimer) : null,
            }))}>Pause</Button>
          ) : (
            <Button size="small" startIcon={<PlayArrow />} onClick={() => void updatePlan((current) => ({
              ...current,
              activeTimer: current.activeTimer ? resumeStudyTimer(current.activeTimer) : null,
            }))}>Resume</Button>
          )}
          <Button
            size="small"
            variant="contained"
            color="success"
            startIcon={<Stop />}
            disabled={timerSeconds < 1}
            onClick={() => void updatePlan((current) => current.activeTimer ? commitTimerToPlan(current, current.activeTimer) : current)}
          >
            Finish and record
          </Button>
          <Button
            size="small"
            color="inherit"
            onClick={() => {
              if (!window.confirm('Discard this unrecorded timer session?')) return
              void updatePlan((current) => {
                const sessionId = current.activeTimer?.sessionId
                return {
                  ...current,
                  activeTimer: null,
                  sessions: current.sessions.map((session) => session.id === sessionId && session.status === 'in-progress'
                    ? { ...session, status: 'planned' }
                    : session),
                }
              })
            }}
          >Discard</Button>
          {timerSession && <span className="focus-session-duration">Planned {formatMinutes(timerSession.plannedMinutes)}</span>}
        </div>
      </div>
    )
  }

  return (
    <Box className="page-shell study-plan-shell">
      <div className="study-plan-intro">
        <div>
          <span className="subject-detail-badge">APPSC GROUP II / {plan.settings.medium.toUpperCase()}</span>
          <h1>Study plan</h1>
          <p>{recommendation?.reason ?? 'Today first, with a schedule that adapts to your pace and keeps completed work in your history.'}</p>
        </div>
        <Button variant="contained" size="large" startIcon={<PlayArrow />} onClick={handleContinue} disabled={!upcomingSession || Boolean(activeTimer)}>
          Continue studying
        </Button>
      </div>

      <Alert severity="info" className="syllabus-source-alert">
        <strong>Syllabus source:</strong> {GROUP_II_SCHEME_NOTICE}{' '}
        {APPSC_GROUP_II_SOURCES.map((source) => (
          <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label}</a>
        ))}
      </Alert>

      {plan.settings.targetDate && projectedFinish && (
        <Alert severity={targetOverrunDays ? 'warning' : 'success'}>
          At an average of {plan.settings.dailyHours} study hours per available day, the remaining topic schedule currently projects to {formatPlanDate(projectedFinish)}.
          {targetOverrunDays
            ? ` That is ${targetOverrunDays} days after your target; increase daily hours or move the target date to keep the plan realistic.`
            : ` Your target date is ${formatPlanDate(plan.settings.targetDate)}.`}
        </Alert>
      )}

      {error && <Alert severity="error">{error} {isSupabaseConfigured ? 'Check your Supabase migration and connection.' : 'Demo progress is saved only in this browser.'}</Alert>}
      {saving && <div className="planner-save-status" role="status">Saving your plan...</div>}

      {overdueSessions.length > 0 && (
        <Card className="panel-card planner-overdue-card">
          <CardContent>
            <div className="planner-section-heading">
              <div>
                <span className="subject-detail-badge">Your plan, your pace</span>
                <h2>{overdueSessions.length} missed session{overdueSessions.length === 1 ? '' : 's'} to resolve</h2>
              </div>
            </div>
            <p>Nothing has been moved automatically. Rescheduling keeps the original date in your history; skipping records that you chose not to do it.</p>
            <div className="planner-overdue-list">
              {overdueSessions.map((session) => {
                const topic = getTopicById(session.topicId)
                const suggestedDate = getSuggestedRescheduleDate(plan, session.id, today)
                if (!topic) return null
                return (
                  <div className="planner-overdue-row" key={session.id}>
                    <div>
                      <strong>{topic.title}</strong>
                      <span>{session.kind} · {formatMinutes(session.plannedMinutes)} · was due {formatPlanDate(session.date)}</span>
                      {suggestedDate && <small>Suggested: {formatPlanDate(suggestedDate)}</small>}
                    </div>
                    <div className="planner-session-actions">
                      <Button
                        size="small"
                        variant="contained"
                        disabled={!suggestedDate || saving}
                        onClick={() => {
                          if (!suggestedDate) return
                          void updatePlan((current) => reschedulePlanSession(current, session.id, suggestedDate))
                        }}
                      >
                        {suggestedDate ? 'Accept suggestion' : 'No free day available'}
                      </Button>
                      <Button
                        size="small"
                        color="inherit"
                        disabled={saving}
                        onClick={() => {
                          if (!window.confirm('Mark this missed session as skipped? Its history will be retained.')) return
                          void updatePlan((current) => skipPlanSession(current, session.id))
                        }}
                      >
                        Skip
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="planner-summary-grid">
        <div className="planner-summary-item"><span>Overall syllabus</span><strong>{overallPercent}%</strong><LinearProgress variant="determinate" value={overallPercent} /></div>
        <div className="planner-summary-item"><span>Today planned / actual</span><strong>{formatMinutes(dailyTotals.plannedMinutes)} / {formatMinutes(Math.floor(dailyTotals.actualSeconds / 60))}</strong></div>
        <div className="planner-summary-item"><span>{period === 'all' ? 'All-plan workload' : `${period[0].toUpperCase()}${period.slice(1)} planned`}</span><strong>{formatMinutes(periodPlannedMinutes)}</strong></div>
        <div className="planner-summary-item"><span>Revisions due</span><strong>{dueRevisions}</strong></div>
      </div>

      <div className="planner-controls-row">
        <ToggleButtonGroup
          value={period}
          exclusive
          aria-label="Study plan period"
          onChange={(_event, value: StudyPlanPeriod | null) => { if (value) setPeriod(value) }}
          size="small"
        >
          <ToggleButton value="today">Today</ToggleButton>
          <ToggleButton value="week">Week</ToggleButton>
          <ToggleButton value="month">Month</ToggleButton>
          <ToggleButton value="all">Long term</ToggleButton>
        </ToggleButtonGroup>
        <TextField
          select
          size="small"
          label="Paper"
          value={paperFilter}
          onChange={(event) => setPaperFilter(event.target.value)}
          sx={{ minWidth: 240 }}
        >
          <MenuItem value="all">All papers</MenuItem>
          {getCurrentGroup2Syllabus().map((paper) => <MenuItem key={paper.id} value={paper.id}>{paper.title}</MenuItem>)}
        </TextField>
      </div>

      <div className="planner-workspace">
        <section className="planner-schedule" aria-labelledby="schedule-heading">
          <div className="planner-section-heading">
            <div>
              <span className="subject-detail-badge">{period === 'today' ? 'Due today' : `${formatPlanDate(range.start)} - ${formatPlanDate(range.end)}`}</span>
              <h2 id="schedule-heading">Scheduled sessions</h2>
            </div>
            <span>{filteredSessions.length} sessions</span>
          </div>

          {timerActions()}

          {filteredSessions.length ? (
            <div className="planner-session-list">
              {filteredSessions.map((session) => {
                const topic = getTopicById(session.topicId)
                const context = getTopicContext(session.topicId)
                if (!topic) return null
                const selected = selectedSession?.id === session.id
                return (
                  <article key={session.id} className={selected ? 'planner-session selected' : 'planner-session'}>
                    <button
                      type="button"
                      className="planner-session-select"
                      onClick={() => { setSelectedTopicId(topic.id); setSelectedSessionId(session.id) }}
                      aria-pressed={selected}
                    >
                      <span className="planner-session-date">{formatPlanDate(session.date)}</span>
                      <span className="planner-session-copy">
                        <strong>{topic.title}</strong>
                        <small>{context?.paper.title} / {context?.subject.title}</small>
                      </span>
                      <span className={`planner-kind kind-${session.kind}`}>{sessionTypeLabels[session.kind]}</span>
                      <span className="planner-session-time">{formatMinutes(session.plannedMinutes)}</span>
                      <span className={`planner-session-status state-${session.status}`}>{session.status.replace('-', ' ')}</span>
                    </button>
                    {session.status === 'planned' && (
                      <div className="planner-session-actions">
                        <Button
                          size="small"
                          startIcon={<PlayArrow />}
                          disabled={Boolean(activeTimer)}
                          onClick={() => {
                            setSelectedTopicId(session.topicId)
                            setSelectedSessionId(session.id)
                            startSession(session.id, session.topicId)
                          }}
                        >Focus</Button>
                        <Button size="small" color="success" onClick={() => handleSessionComplete(session.id)}>Complete</Button>
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="planner-empty-state">
              <strong>No sessions in this period.</strong>
              <span>Choose another period or add a topic session from the syllabus.</span>
            </div>
          )}

          {selectedSession?.status === 'planned' && (
            <div className="planner-reschedule-row">
              <TextField
                label="Reschedule to"
                type="date"
                size="small"
                value={rescheduleDate}
                onChange={(event) => setRescheduleDate(event.target.value)}
                slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: today } }}
              />
              <Button variant="outlined" onClick={handleReschedule} disabled={rescheduleDate < today}>Move session</Button>
            </div>
          )}
        </section>

        <aside className="planner-topic-column">
          {selectedTopic ? (
            <StudyTopicPanel
              key={selectedTopic.id}
              topic={selectedTopic}
              plan={plan}
              onUpdate={(changes) => void updatePlan((current) => updateTopicProgress(current, selectedTopic.id, changes))}
              onComplete={() => handleTopicComplete(selectedTopic.id)}
            />
          ) : (
            <div className="planner-empty-state">Select a session or continue studying to open a topic.</div>
          )}
        </aside>
      </div>

      <Card className="panel-card planner-settings-card">
        <CardContent>
          <StudyPlanSettingsForm key={`${plan.settings.level}-${plan.settings.medium}-${plan.settings.dailyHours}-${plan.settings.targetDate}-${plan.settings.dayAvailability.join(',')}`} settings={plan.settings} onApply={handleRecalculate} saving={saving} />
        </CardContent>
      </Card>

      <Card className="panel-card planner-activity-card">
        <CardContent>
          <div className="planner-section-heading">
            <div><span className="subject-detail-badge">Saved history</span><h2>Study activity</h2></div>
            <span>{formatMinutes(Math.floor(periodActualSeconds / 60))} recorded this period</span>
          </div>
          <div className="planner-progress-line"><span>Completed topic sessions</span><strong>{periodSessions.filter((session) => session.status === 'completed').length} / {periodSessions.length}</strong></div>
          <LinearProgress
            variant="determinate"
            value={periodSessions.length ? (periodSessions.filter((session) => session.status === 'completed').length / periodSessions.length) * 100 : 0}
          />
          <div className="planner-sync-note">
            {isSupabaseConfigured
              ? `Progress is stored against ${user?.email ?? 'your account'} in Supabase.`
              : 'Demo mode: progress is saved in this browser under your demo account.'}
          </div>
          <Button
            size="small"
            onClick={() => {
              const topic = selectedTopic ?? getAllSyllabusTopics()[0]
              void updatePlan((current) => addPlanSession(current, topic.id, today, 'practice', 20))
              setPeriod('today')
            }}
          >
            Add 20-minute practice session
          </Button>
        </CardContent>
      </Card>
    </Box>
  )
}
