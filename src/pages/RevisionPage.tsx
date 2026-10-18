import { useNavigate } from 'react-router-dom'
import { Alert, Box, Button, Card, CardContent, CircularProgress } from '@mui/material'
import { Bookmark, EventAvailable, ReportProblemOutlined } from '@mui/icons-material'
import { getTopicPracticeQuestions } from '../data/topicPracticeQuestions'
import { completePlanSession, getLocalDateKey, getRevisionSessions, getTopicById } from '../lib/studyPlanner'
import { useAppStore } from '../store/useAppStore'
import { useStudyPlanStore } from '../store/useStudyPlanStore'

const formatDueDate = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString('en-IN', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
})

export function RevisionPage() {
  const navigate = useNavigate()
  const user = useAppStore((state) => state.user)
  const plan = useStudyPlanStore((state) => state.plan)
  const loading = useStudyPlanStore((state) => state.loading)
  const error = useStudyPlanStore((state) => state.error)
  const updatePlan = useStudyPlanStore((state) => state.updatePlan)
  const loadForUser = useStudyPlanStore((state) => state.loadForUser)
  const today = getLocalDateKey()

  if (loading) {
    return <Box className="page-shell planner-loading"><CircularProgress aria-label="Loading revision plan" /></Box>
  }

  if (!plan) {
    return (
      <Box className="page-shell">
        <Alert severity="error">{error ?? 'Your revision plan is not available yet.'}</Alert>
        <Button variant="outlined" onClick={() => user?.id && void loadForUser(user.id)} disabled={!user?.id}>Retry loading revisions</Button>
      </Box>
    )
  }

  const revisions = getRevisionSessions(plan, today)
  const dueRevisions = revisions.filter((session) => session.date <= today)
  const upcomingRevisions = revisions.filter((session) => session.date > today).slice(0, 6)
  const savedTopics = plan.topicProgress.filter((progress) => progress.bookmarked || progress.notes.trim())
  const incorrectAttempts = plan.quizAttempts.filter((attempt) => !attempt.correct).slice().reverse().slice(0, 12)

  const openTopic = (topicId: string) => navigate(`/study-plan?topic=${encodeURIComponent(topicId)}`)

  return (
    <Box className="page-shell revision-center">
      <div className="revision-center-header">
        <div>
          <span className="subject-detail-badge">Retention cycle</span>
          <h1>Revision center</h1>
          <p>Due reviews are scheduled at 1, 3, 7, 14, and 30 days after study.</p>
        </div>
        <div className="revision-count-summary">
          <strong>{dueRevisions.length}</strong>
          <span>due or overdue</span>
        </div>
      </div>

      {error && <Alert severity="error">{error}</Alert>}

      <div className="revision-center-grid">
        <Card className="panel-card revision-center-card">
          <CardContent>
            <div className="planner-section-heading">
              <div><span className="subject-detail-badge">Due now</span><h2>Today's revisions</h2></div>
              <span>{dueRevisions.filter((session) => session.overdue).length} overdue</span>
            </div>
            {dueRevisions.length ? (
              <div className="revision-center-list">
                {dueRevisions.map((session) => {
                  const topic = getTopicById(session.topicId)
                  if (!topic) return null
                  return (
                    <div key={session.id} className="revision-center-row">
                      <div className="revision-row-icon" data-overdue={session.overdue}>
                        {session.overdue ? <ReportProblemOutlined fontSize="small" /> : <EventAvailable fontSize="small" />}
                      </div>
                      <div className="revision-row-copy">
                        <strong>{topic.title}</strong>
                        <span>{session.overdue ? `Was due ${formatDueDate(session.date)}` : `Due ${formatDueDate(session.date)}`} / {session.plannedMinutes} min</span>
                      </div>
                      <div className="revision-row-actions">
                        <Button size="small" onClick={() => openTopic(topic.id)}>Review topic</Button>
                        <Button size="small" variant="contained" onClick={() => void updatePlan((current) => completePlanSession(current, session.id))}>Mark reviewed</Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="planner-empty-state"><strong>Nothing due today.</strong><span>Completing a topic adds its first review for tomorrow.</span></div>
            )}
          </CardContent>
        </Card>

        <Card className="panel-card revision-center-card">
          <CardContent>
            <div className="planner-section-heading">
              <div><span className="subject-detail-badge">Next up</span><h2>Upcoming revisions</h2></div>
              <span>{upcomingRevisions.length} scheduled</span>
            </div>
            {upcomingRevisions.length ? (
              <div className="revision-center-list">
                {upcomingRevisions.map((session) => {
                  const topic = getTopicById(session.topicId)
                  if (!topic) return null
                  return (
                    <div key={session.id} className="revision-upcoming-row">
                      <span>{formatDueDate(session.date)}</span>
                      <strong>{topic.title}</strong>
                      <Button size="small" onClick={() => openTopic(topic.id)}>Open topic</Button>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="planner-empty-inline">No future revision sessions are scheduled yet.</p>
            )}
          </CardContent>
        </Card>

        <Card className="panel-card revision-center-card">
          <CardContent>
            <div className="planner-section-heading">
              <div><span className="subject-detail-badge">Keep close</span><h2>Bookmarks and notes</h2></div>
              <span>{savedTopics.length} topics</span>
            </div>
            {savedTopics.length ? (
              <div className="revision-center-list">
                {savedTopics.map((progress) => {
                  const topic = getTopicById(progress.topicId)
                  if (!topic) return null
                  return (
                    <div key={progress.topicId} className="revision-saved-row">
                      <Bookmark fontSize="small" color={progress.bookmarked ? 'primary' : 'disabled'} />
                      <div className="revision-row-copy">
                        <strong>{topic.title}</strong>
                        <span>{progress.notes || 'Bookmarked for later review.'}</span>
                      </div>
                      <Button size="small" onClick={() => openTopic(topic.id)}>Open</Button>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="planner-empty-inline">Bookmark a topic or save a study note to build your revision library.</p>
            )}
          </CardContent>
        </Card>

        <Card className="panel-card revision-center-card">
          <CardContent>
            <div className="planner-section-heading">
              <div><span className="subject-detail-badge">Practice follow-up</span><h2>Previously incorrect</h2></div>
              <span>{incorrectAttempts.length} saved</span>
            </div>
            {incorrectAttempts.length ? (
              <div className="revision-center-list">
                {incorrectAttempts.map((attempt) => {
                  const topic = getTopicById(attempt.topicId)
                  const question = getTopicPracticeQuestions(attempt.topicId).find((item) => item.id === attempt.questionId)
                  if (!topic || !question) return null
                  return (
                    <div key={attempt.id} className="revision-wrong-row">
                      <div>
                        <strong>{question.prompt}</strong>
                        <span>{topic.title} / Correct answer: {question.options[question.correctIndex]}</span>
                      </div>
                      <Button size="small" onClick={() => openTopic(topic.id)}>Review</Button>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="planner-empty-inline">Incorrect answers from planner practice checks will be collected here.</p>
            )}
            <p className="topic-source-note">Planner practice questions are not official or previous-year APPSC questions.</p>
          </CardContent>
        </Card>
      </div>
    </Box>
  )
}
