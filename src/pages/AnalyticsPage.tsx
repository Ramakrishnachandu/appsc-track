import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, Box, Button, Card, CardContent, CircularProgress, LinearProgress } from '@mui/material'
import { getAllSyllabusTopics, getCurrentGroup2Syllabus } from '../data/group2Syllabus'
import { getUserMockAttemptsFromApi } from '../lib/mockTestApi'
import { addDaysToDateKey, getLocalDateKey, getTopicProgress } from '../lib/studyPlanner'
import { useAppStore } from '../store/useAppStore'
import { useStudyPlanStore } from '../store/useStudyPlanStore'
import type { MockAttempt } from '../data/dashboardData'

const startOfWeek = (dateKey: string) => {
  const date = new Date(`${dateKey}T12:00:00`)
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7))
  return getLocalDateKey(date)
}

const formatHours = (seconds: number) => `${(seconds / 3600).toFixed(1)}h`

export function AnalyticsPage() {
  const navigate = useNavigate()
  const user = useAppStore((state) => state.user)
  const [mockAttempts, setMockAttempts] = useState<MockAttempt[]>([])
  const [mockAttemptsError, setMockAttemptsError] = useState<string | null>(null)
  const plan = useStudyPlanStore((state) => state.plan)
  const loading = useStudyPlanStore((state) => state.loading)
  const error = useStudyPlanStore((state) => state.error)
  const loadForUser = useStudyPlanStore((state) => state.loadForUser)
  const today = getLocalDateKey()

  useEffect(() => {
    if (!user?.id) return
    let isCurrentUser = true
    void getUserMockAttemptsFromApi(user.id).then((attempts) => {
      if (isCurrentUser) setMockAttempts(attempts)
    }).catch((loadError) => {
      if (isCurrentUser) setMockAttemptsError(loadError instanceof Error ? loadError.message : 'Unable to load mock results.')
    })
    return () => { isCurrentUser = false }
  }, [user?.id])

  if (loading) return <Box className="page-shell planner-loading"><CircularProgress aria-label="Loading analytics" /></Box>

  if (!plan) {
    return (
      <Box className="page-shell">
        <Alert severity="error">{error ?? 'Your study analytics are not available yet.'}</Alert>
        <Button variant="outlined" onClick={() => user?.id && void loadForUser(user.id)} disabled={!user?.id}>Retry loading analytics</Button>
      </Box>
    )
  }

  const topics = getAllSyllabusTopics()
  const completedTopics = plan.topicProgress.filter((progress) => progress.status === 'completed').length
  const syllabusCompletion = topics.length ? Math.round((completedTopics / topics.length) * 100) : 0
  const recordedSessions = plan.sessions.filter((session) => session.status === 'completed')
  const totalStudySeconds = recordedSessions.reduce((sum, session) => sum + (session.actualSeconds ?? 0), 0)
  const totalCorrect = plan.quizAttempts.filter((attempt) => attempt.correct).length
  const quizAccuracy = plan.quizAttempts.length ? Math.round((totalCorrect / plan.quizAttempts.length) * 100) : null
  const mockQuestions = mockAttempts.reduce((sum, attempt) => sum + attempt.total, 0)
  const mockCorrect = mockAttempts.reduce((sum, attempt) => sum + (attempt.correct ?? attempt.score), 0)
  const mockAccuracy = mockQuestions ? Math.round((mockCorrect / mockQuestions) * 100) : null
  const revisionSessions = plan.sessions.filter((session) => session.kind === 'revision')
  const completedRevisions = revisionSessions.filter((session) => session.status === 'completed').length
  const revisionRate = revisionSessions.length ? Math.round((completedRevisions / revisionSessions.length) * 100) : null

  const subjectMetrics = getCurrentGroup2Syllabus().flatMap((paper) => paper.subjects.map((subject) => {
    const subjectTopics = subject.units.flatMap((unit) => unit.topics)
    const topicIds = new Set(subjectTopics.map((topic) => topic.id))
    const seconds = recordedSessions.reduce((sum, session) => sum + (topicIds.has(session.topicId) ? session.actualSeconds ?? 0 : 0), 0)
    const completed = subjectTopics.filter((topic) => getTopicProgress(plan, topic.id)?.status === 'completed').length
    const attempts = plan.quizAttempts.filter((attempt) => topicIds.has(attempt.topicId))
    const correct = attempts.filter((attempt) => attempt.correct).length
    return {
      id: subject.id,
      title: subject.title,
      paperTitle: paper.title,
      seconds,
      completed,
      topicCount: subjectTopics.length,
      accuracy: attempts.length ? Math.round((correct / attempts.length) * 100) : null,
      attempts: attempts.length,
    }
  }))

  const thisWeekStart = startOfWeek(today)
  const weeks = Array.from({ length: 6 }, (_, index) => {
    const weekStart = addDaysToDateKey(thisWeekStart, (index - 5) * 7)
    const weekEnd = addDaysToDateKey(weekStart, 6)
    const sessions = recordedSessions.filter((session) => session.date >= weekStart && session.date <= weekEnd)
    const actualSeconds = sessions.reduce((sum, session) => sum + (session.actualSeconds ?? 0), 0)
    const plannedMinutes = plan.sessions
      .filter((session) => session.date >= weekStart && session.date <= weekEnd && session.status !== 'rescheduled' && session.status !== 'skipped')
      .reduce((sum, session) => sum + session.plannedMinutes, 0)
    const weekDate = new Date(`${weekStart}T12:00:00`)
    const label = weekDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    return { weekStart, label, actualSeconds, plannedMinutes, activeDays: new Set(sessions.map((session) => session.date)).size }
  })
  const maxStudyMinutes = Math.max(60, ...weeks.map((week) => Math.max(week.actualSeconds / 60, week.plannedMinutes)))
  const daysThisMonth = recordedSessions
    .filter((session) => session.date.slice(0, 7) === today.slice(0, 7))
    .reduce((days, session) => days.add(session.date), new Set<string>()).size

  const topicRisks = topics.map((topic) => {
    const attempts = plan.quizAttempts.filter((attempt) => attempt.topicId === topic.id)
    const correct = attempts.filter((attempt) => attempt.correct).length
    const progress = getTopicProgress(plan, topic.id)
    const accuracy = attempts.length ? Math.round((correct / attempts.length) * 100) : null
    return { topic, attempts, accuracy, progress }
  }).filter((item) => item.attempts.some((attempt) => !attempt.correct) || (item.progress?.confidence ?? 5) <= 2)
    .sort((first, second) => (first.accuracy ?? 100) - (second.accuracy ?? 100))
    .slice(0, 6)

  return (
    <Box className="page-shell analytics-live-page">
      <div className="study-plan-intro">
        <div>
          <span className="subject-detail-badge">LEARNING RECORD</span>
          <h1>Analytics</h1>
        {mockAttemptsError && <Alert severity="warning">Mock test results could not be refreshed: {mockAttemptsError}</Alert>}
          <p>Metrics below use completed timers, topic statuses, and saved topic practice answers.</p>
        </div>
        <Button variant="outlined" onClick={() => navigate('/study-plan')}>Open study plan</Button>
      </div>

      <div className="analytics-summary-grid">
        {[
          { label: 'Syllabus completion', value: `${syllabusCompletion}%`, caption: `${completedTopics} of ${topics.length} topics complete` },
          { label: 'Recorded study time', value: formatHours(totalStudySeconds), caption: `${recordedSessions.length} completed timer sessions` },
          { label: 'Topic-check accuracy', value: quizAccuracy === null ? 'No data' : `${quizAccuracy}%`, caption: `${plan.quizAttempts.length} answers recorded` },
          { label: 'Mock test accuracy', value: mockAccuracy === null ? 'No data' : `${mockAccuracy}%`, caption: `${mockAttempts.length} tests / ${mockQuestions} questions` },
          { label: 'Revision completion', value: revisionRate === null ? 'No data' : `${revisionRate}%`, caption: `${completedRevisions} of ${revisionSessions.length} scheduled reviews` },
        ].map((metric) => (
          <Card key={metric.label} className="panel-card analytics-summary-card">
            <CardContent>
              <div className="analytics-card-header"><span>{metric.label}</span></div>
              <div className="analytics-card-value">{metric.value}</div>
              <p>{metric.caption}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="content-grid analytics-grid">
        <Card className="panel-card">
          <CardContent>
            <div className="analytics-section-heading"><h2>Planned vs actual study time</h2><div className="analytics-tag">{daysThisMonth} study days this month</div></div>
            <div className="analytics-legend"><span>Actual</span><span>Planned</span></div>
            <div className="mini-bars">
              {weeks.map((week) => (
                <div key={week.weekStart} className="mini-bar-item analytics-week-bar">
                  <div className="analytics-week-bars">
                    <div className="mini-bar actual" style={{ height: `${Math.max(3, (week.actualSeconds / 60 / maxStudyMinutes) * 100)}%` }} />
                    <div className="mini-bar planned" style={{ height: `${Math.max(3, (week.plannedMinutes / maxStudyMinutes) * 100)}%` }} />
                  </div>
                  <span>{week.label}</span>
                  <small>{week.activeDays}d</small>
                </div>
              ))}
            </div>
            <p className="analytics-empty-state">Weekly actual values include only finished study timers; paused, abandoned, and uncheckpointed interrupted time is excluded.</p>
          </CardContent>
        </Card>

        <Card className="panel-card">
          <CardContent>
            <div className="analytics-section-heading"><h2>Weak recall and confidence</h2><div className="analytics-tag">{topicRisks.length} topics to review</div></div>
            {topicRisks.length ? (
              <div className="analytics-topic-risks">
                {topicRisks.map(({ topic, accuracy, attempts, progress }) => (
                  <button key={topic.id} type="button" onClick={() => navigate(`/study-plan?topic=${encodeURIComponent(topic.id)}`)}>
                    <span><strong>{topic.title}</strong><small>{attempts.length ? `${attempts.length} practice answers` : 'Low confidence rating'}</small></span>
                    <span>{accuracy === null ? `Confidence ${progress?.confidence ?? '-'}/5` : `${accuracy}% accuracy`}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="analytics-empty-state">No weak areas yet. Incorrect answers and low-confidence topics will appear here.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="panel-card">
        <CardContent>
          <div className="analytics-section-heading"><h2>Recent mock attempts</h2><div className="analytics-tag">{mockAttempts.length} saved</div></div>
          {mockAttempts.length ? (
            <div className="analytics-attempt-list">
              {mockAttempts.slice(0, 5).map((attempt) => (
                <div className="analytics-attempt-item" key={attempt.id}>
                  <div><strong>{attempt.testTitle}</strong><p>{attempt.paperType} / {attempt.subjectName}</p></div>
                  <div className="analytics-attempt-score"><span>{attempt.score}/{attempt.total}</span><strong>{attempt.accuracy ?? 0}%</strong></div>
                </div>
              ))}
            </div>
          ) : (
            <p className="analytics-empty-state">No mock attempts recorded for this account yet.</p>
          )}
        </CardContent>
      </Card>

      <Card className="panel-card">
        <CardContent>
          <div className="analytics-section-heading"><h2>Subject workload</h2><div className="analytics-tag">Actual time and topic completion</div></div>
          <div className="analytics-subject-list">
            {subjectMetrics.map((subject) => (
              <div className="analytics-subject-row" key={subject.id}>
                <div className="analytics-subject-row-heading"><div><strong>{subject.title}</strong><small>{subject.paperTitle}</small></div><span>{formatHours(subject.seconds)} / {subject.completed}/{subject.topicCount} topics</span></div>
                <LinearProgress variant="determinate" value={subject.topicCount ? (subject.completed / subject.topicCount) * 100 : 0} />
                <div className="analytics-subject-row-footer"><span>{subject.attempts ? `${subject.accuracy}% across ${subject.attempts} answers` : 'No topic practice answers yet'}</span><Button size="small" onClick={() => navigate('/subjects')}>Open syllabus</Button></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </Box>
  )
}
