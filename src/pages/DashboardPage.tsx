import { Alert, Box, Button, Chip, LinearProgress } from '@mui/material'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllSyllabusTopics, getCurrentGroup2Syllabus } from '../data/group2Syllabus'
import { getTopicPracticeQuestions } from '../data/topicPracticeQuestions'
import { getUserMockAttemptsFromApi } from '../lib/mockTestApi'
import {
  addDaysToDateKey,
  getDailyCapacityMinutes,
  getLocalDateKey,
  getRevisionSessions,
  getSessionsInPeriod,
  getStudyRecommendation,
  getTopicById,
  getTopicProgress,
} from '../lib/studyPlanner'
import { useAppStore } from '../store/useAppStore'
import { useStudyPlanStore } from '../store/useStudyPlanStore'
import type { MockAttempt } from '../data/dashboardData'

const formatMinutes = (minutes: number) => {
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  if (hours && remainder) return `${hours}h ${remainder}m`
  if (hours) return `${hours}h`
  return `${remainder}m`
}

const getTopicContext = (topicId: string) => {
  for (const paper of getCurrentGroup2Syllabus()) {
    for (const subject of paper.subjects) {
      if (subject.units.some((unit) => unit.topics.some((topic) => topic.id === topicId))) {
        return { paper, subject }
      }
    }
  }
  return null
}

const getStudyStreak = (completedDays: Set<string>, today: string) => {
  let streak = 0
  let checkDate = completedDays.has(today) ? today : addDaysToDateKey(today, -1)
  while (completedDays.has(checkDate)) {
    streak += 1
    checkDate = addDaysToDateKey(checkDate, -1)
  }
  return streak
}

export function DashboardPage() {
  const navigate = useNavigate()
  const user = useAppStore((state) => state.user)
  const plan = useStudyPlanStore((state) => state.plan)
  const loading = useStudyPlanStore((state) => state.loading)
  const error = useStudyPlanStore((state) => state.error)
  const loadForUser = useStudyPlanStore((state) => state.loadForUser)
  const [mockAttempts, setMockAttempts] = useState<MockAttempt[]>([])
  const [mockAttemptsError, setMockAttemptsError] = useState<string | null>(null)
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

  if (loading) {
    return <Box className="page-shell"><div className="dashboard-loading">Preparing your study day...</div></Box>
  }

  if (!plan) {
    return (
      <Box className="page-shell">
        <Alert severity="error">{error ?? 'Your study plan is not available yet.'}</Alert>
        <Button variant="outlined" onClick={() => user?.id && void loadForUser(user.id)} disabled={!user?.id}>Retry loading dashboard</Button>
      </Box>
    )
  }

  const allTopics = getAllSyllabusTopics()
  const topicCount = allTopics.length
  const overallCompletion = topicCount
    ? Math.round(allTopics.reduce((sum, topic) => sum + (getTopicProgress(plan, topic.id)?.completionPercent ?? 0), 0) / topicCount)
    : 0
  const todaySessions = getSessionsInPeriod(plan.sessions, 'today', today)
  const weekSessions = getSessionsInPeriod(plan.sessions, 'week', today)
  const todayPlannedMinutes = todaySessions.filter((session) => session.status !== 'skipped').reduce((sum, session) => sum + session.plannedMinutes, 0)
  const todayActualSeconds = todaySessions.reduce((sum, session) => sum + (session.actualSeconds ?? 0), 0)
  const todayCapacityMinutes = getDailyCapacityMinutes(plan.settings, today)
  const weekCompleted = weekSessions.filter((session) => session.status === 'completed')
  const weekActualSeconds = weekCompleted.reduce((sum, session) => sum + (session.actualSeconds ?? 0), 0)
  const completedDays = new Set(plan.sessions.filter((session) => session.status === 'completed').map((session) => session.date))
  const studyStreak = getStudyStreak(completedDays, today)
  const recommendation = getStudyRecommendation(plan, today)
  const pendingSession = recommendation?.session ?? null
  const currentSessionTopic = plan.activeTimer ? getTopicById(plan.activeTimer.topicId) : null
  const continueTopicId = currentSessionTopic?.id ?? pendingSession?.topicId ?? allTopics.find((topic) => {
    return getTopicProgress(plan, topic.id)?.status !== 'completed'
  })?.id
  const dueRevisions = getRevisionSessions(plan, today).filter((session) => session.date <= today)
  const upcomingRevisions = getRevisionSessions(plan, today).filter((session) => session.date > today).slice(0, 4)
  const targetDate = plan.settings.targetDate
  const remainingDays = targetDate
    ? Math.max(0, Math.ceil((new Date(`${targetDate}T12:00:00`).getTime() - new Date(`${today}T12:00:00`).getTime()) / 86400000))
    : null

  const subjectProgress = getCurrentGroup2Syllabus().flatMap((paper) => paper.subjects.map((subject) => {
    const topics = subject.units.flatMap((unit) => unit.topics)
    const percent = topics.length
      ? Math.round(topics.reduce((sum, topic) => sum + (getTopicProgress(plan, topic.id)?.completionPercent ?? 0), 0) / topics.length)
      : 0
    return { paper, subject, percent, completed: topics.filter((topic) => getTopicProgress(plan, topic.id)?.status === 'completed').length, total: topics.length }
  }))

  const topicAccuracy = new Map<string, { correct: number; total: number }>()
  plan.quizAttempts.forEach((attempt) => {
    const context = getTopicContext(attempt.topicId)
    if (!context) return
    const entry = topicAccuracy.get(context.subject.id) ?? { correct: 0, total: 0 }
    entry.correct += attempt.correct ? 1 : 0
    entry.total += 1
    topicAccuracy.set(context.subject.id, entry)
  })
  const weakSubjects = Array.from(topicAccuracy.entries())
    .map(([subjectId, result]) => ({
      title: subjectProgress.find((item) => item.subject.id === subjectId)?.subject.title ?? subjectId,
      accuracy: Math.round((result.correct / result.total) * 100),
      attempts: result.total,
    }))
    .sort((first, second) => first.accuracy - second.accuracy)
    .slice(0, 3)
  const recentAnswers = plan.quizAttempts.slice().sort((first, second) => second.attemptedAt.localeCompare(first.attemptedAt)).slice(0, 4)
  const availableTopicCount = plan.topicProgress.filter((progress) => progress.status !== 'completed').length

  return (
    <Box className="page-shell dashboard-study-shell">
      <div className="dashboard-study-intro">
        <div>
          <span className="subject-detail-badge">APPSC GROUP II / STUDY DAY</span>
          <h1>Welcome, {user?.name || 'Student'}</h1>
          <p>{new Date(`${today}T12:00:00`).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          {recommendation && <p className="dashboard-recommendation-reason">Next step: {recommendation.reason}</p>}
        </div>
        <Button
          variant="contained"
          size="large"
          onClick={() => continueTopicId && navigate(`/study-plan?topic=${encodeURIComponent(continueTopicId)}`)}
          disabled={!continueTopicId}
        >
          {currentSessionTopic ? 'Continue current session' : 'Continue studying'}
        </Button>
      </div>

      {error && <Alert severity="error">{error}</Alert>}
      {mockAttemptsError && <Alert severity="warning">Mock test results could not be refreshed: {mockAttemptsError}</Alert>}

      <div className="dashboard-study-metrics">
        <div className="dashboard-study-metric">
          <span>Today's study time</span>
          <strong>{formatMinutes(Math.floor(todayActualSeconds / 60))} <small>/ {formatMinutes(todayCapacityMinutes)}</small></strong>
          <LinearProgress variant="determinate" value={todayCapacityMinutes ? Math.min(100, (todayActualSeconds / 60 / todayCapacityMinutes) * 100) : 0} />
        </div>
        <div className="dashboard-study-metric">
          <span>Overall syllabus</span>
          <strong>{overallCompletion}%</strong>
          <LinearProgress variant="determinate" value={overallCompletion} />
        </div>
        <div className="dashboard-study-metric">
          <span>Topics remaining</span>
          <strong>{availableTopicCount} <small>of {topicCount}</small></strong>
          <span className="dashboard-metric-footnote">{plan.topicProgress.filter((topic) => topic.status === 'completed').length} completed</span>
        </div>
        <div className="dashboard-study-metric">
          <span>Study streak</span>
          <strong>{studyStreak} <small>days</small></strong>
          <span className="dashboard-metric-footnote">{weekCompleted.length} sessions / {new Set(weekCompleted.map((session) => session.date)).size} days this week</span>
        </div>
        <div className="dashboard-study-metric">
          <span>Revisions overdue</span>
          <strong>{dueRevisions.filter((session) => session.overdue).length}</strong>
          <Button size="small" onClick={() => navigate('/revision')}>Open revision center</Button>
        </div>
        <div className="dashboard-study-metric">
          <span>Target date</span>
          <strong>{remainingDays === null ? 'Not set' : `${remainingDays} days`}</strong>
          <Button size="small" onClick={() => navigate('/study-plan')}>{targetDate ? 'Adjust target' : 'Set a target'}</Button>
        </div>
      </div>

      <div className="dashboard-study-main-grid">
        <section className="dashboard-study-section" aria-labelledby="dashboard-today-heading">
          <div className="dashboard-section-heading">
            <div><span className="subject-detail-badge">{formatMinutes(todayPlannedMinutes)} planned</span><h2 id="dashboard-today-heading">Today's study plan</h2></div>
            <Button size="small" onClick={() => navigate('/study-plan')}>Open plan</Button>
          </div>
          {todaySessions.length ? (
            <div className="dashboard-session-list">
              {todaySessions.slice(0, 6).map((session) => {
                const topic = getTopicById(session.topicId)
                const context = getTopicContext(session.topicId)
                if (!topic) return null
                return (
                  <button
                    key={session.id}
                    type="button"
                    className="dashboard-session-row"
                    onClick={() => navigate(`/study-plan?topic=${encodeURIComponent(topic.id)}`)}
                  >
                    <span className="dashboard-session-time">{session.plannedMinutes} min</span>
                    <span className="dashboard-session-title"><strong>{topic.title}</strong><small>{context?.subject.title}</small></span>
                    <Chip size="small" label={session.status.replace('-', ' ')} />
                  </button>
                )
              })}
            </div>
          ) : (
            <p className="dashboard-empty-copy">{todayCapacityMinutes ? 'No sessions scheduled for today. Choose a topic in your study plan to get started.' : 'Today is marked as a rest day in your weekly availability.'}</p>
          )}
          <div className="dashboard-actual-summary">
            <span>Completed study time</span>
            <strong>{formatMinutes(Math.floor(todayActualSeconds / 60))} / {formatMinutes(todayCapacityMinutes)}</strong>
          </div>
        </section>

        <section className="dashboard-study-section" aria-labelledby="dashboard-subjects-heading">
          <div className="dashboard-section-heading">
            <div><span className="subject-detail-badge">{subjectProgress.length} subjects</span><h2 id="dashboard-subjects-heading">Subject progress</h2></div>
            <Button size="small" onClick={() => navigate('/subjects')}>Syllabus</Button>
          </div>
          <div className="dashboard-subject-progress-list">
            {subjectProgress.slice(0, 6).map(({ paper, subject, percent, completed, total }) => (
              <div key={`${paper.id}-${subject.id}`} className="dashboard-subject-progress-row">
                <div><span>{subject.title}</span><strong>{percent}%</strong></div>
                <LinearProgress variant="determinate" value={percent} />
                <small>{completed} / {total} topics complete</small>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="dashboard-study-lower-grid">
        <section className="dashboard-study-section" aria-labelledby="dashboard-revision-heading">
          <div className="dashboard-section-heading">
            <div><span className="subject-detail-badge">Spaced reviews</span><h2 id="dashboard-revision-heading">Revision queue</h2></div>
            <Button size="small" onClick={() => navigate('/revision')}>View all</Button>
          </div>
          {dueRevisions.length || upcomingRevisions.length ? (
            <div className="dashboard-compact-list">
              {[...dueRevisions, ...upcomingRevisions].slice(0, 5).map((session) => {
                const topic = getTopicById(session.topicId)
                if (!topic) return null
                const label = session.overdue ? `Overdue since ${session.date}` : session.date === today ? 'Due today' : `Due ${session.date}`
                return <button key={session.id} type="button" onClick={() => navigate(`/study-plan?topic=${encodeURIComponent(topic.id)}`)}><strong>{topic.title}</strong><span>{label}</span></button>
              })}
            </div>
          ) : (
            <p className="dashboard-empty-copy">No reviews due. Marking a topic complete starts its 1, 3, 7, 14, and 30-day cycle.</p>
          )}
        </section>

        <section className="dashboard-study-section" aria-labelledby="dashboard-performance-heading">
          <div className="dashboard-section-heading">
            <div><span className="subject-detail-badge">Saved practice checks</span><h2 id="dashboard-performance-heading">Recent results</h2></div>
            <Button size="small" onClick={() => navigate('/practice')}>Practice</Button>
          </div>
          {recentAnswers.length || mockAttempts.length ? (
            <div className="dashboard-compact-list">
              {mockAttempts.slice(0, 3).map((attempt) => (
                <button key={attempt.id} type="button" onClick={() => navigate('/mock-tests')}>
                  <strong>{attempt.testTitle}</strong>
                  <span>Mock test: {attempt.score}/{attempt.total} ({attempt.accuracy ?? 0}%) / {attempt.subjectName}</span>
                </button>
              ))}
              {recentAnswers.map((attempt) => {
                const topic = getTopicById(attempt.topicId)
                const question = getTopicPracticeQuestions(attempt.topicId).find((item) => item.id === attempt.questionId)
                if (!topic || !question) return null
                return <button key={attempt.id} type="button" onClick={() => navigate(`/study-plan?topic=${encodeURIComponent(topic.id)}`)}><strong>{topic.title}</strong><span>{attempt.correct ? 'Correct' : `Review: ${question.options[question.correctIndex]}`}</span></button>
              })}
            </div>
          ) : (
            <p className="dashboard-empty-copy">Your practice results will appear here after a topic quick check.</p>
          )}
          {weakSubjects.length > 0 && (
            <div className="dashboard-weak-subjects">
              <h3>Focus areas from your answers</h3>
              {weakSubjects.map((subject) => <span key={subject.title}>{subject.title}: {subject.accuracy}% ({subject.attempts} checks)</span>)}
            </div>
          )}
        </section>
      </div>

      <div className="dashboard-study-footer">
        <span>This week's recorded study: {formatMinutes(Math.floor(weekActualSeconds / 60))}</span>
        <Button size="small" onClick={() => navigate('/mock-tests')}>Available mock tests</Button>
      </div>
    </Box>
  )
}