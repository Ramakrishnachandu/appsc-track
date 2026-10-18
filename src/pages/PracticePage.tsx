import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, Box, Button, MenuItem, TextField } from '@mui/material'
import { getCurrentGroup2Syllabus } from '../data/group2Syllabus'
import { getTopicPracticeQuestions } from '../data/topicPracticeQuestions'
import { getTopicProgress } from '../lib/studyPlanner'
import { useStudyPlanStore } from '../store/useStudyPlanStore'

export function PracticePage() {
  const navigate = useNavigate()
  const plan = useStudyPlanStore((state) => state.plan)
  const [paperId, setPaperId] = useState('all')
  const syllabus = getCurrentGroup2Syllabus()
  const questionTopics = syllabus.flatMap((paper) => paper.subjects.flatMap((subject) => subject.units.flatMap((unit) => unit.topics)))
    .map((topic) => ({
      topic,
      paper: syllabus.find((paper) => paper.subjects.some((subject) => subject.units.some((unit) => unit.topics.some((item) => item.id === topic.id)))),
      subject: syllabus.flatMap((paper) => paper.subjects).find((subject) => subject.units.some((unit) => unit.topics.some((item) => item.id === topic.id))),
      questions: getTopicPracticeQuestions(topic.id),
    }))
    .filter((item) => item.questions.length)
    .filter((item) => paperId === 'all' || item.paper?.id === paperId)
  const attempts = plan?.quizAttempts ?? []
  const correct = attempts.filter((attempt) => attempt.correct).length
  const incorrect = attempts.length - correct
  const accuracy = attempts.length ? Math.round((correct / attempts.length) * 100) : null

  return (
    <Box className="page-shell topic-practice-page">
      <div className="study-plan-intro">
        <div>
          <span className="subject-detail-badge">TOPIC PRACTICE</span>
          <h1>Practice checks</h1>
          <p>Short topic checks with explanations and saved results.</p>
        </div>
        <TextField select label="Paper" size="small" value={paperId} onChange={(event) => setPaperId(event.target.value)} sx={{ minWidth: 240 }}>
          <MenuItem value="all">All papers</MenuItem>
          {syllabus.map((paper) => <MenuItem key={paper.id} value={paper.id}>{paper.title}</MenuItem>)}
        </TextField>
      </div>

      <Alert severity="info">These are original planner practice questions, not verified previous-year questions or official APPSC questions. In-app answer accuracy is for study guidance, not official exam scoring.</Alert>

      <div className="practice-live-metrics">
        <div><span>Answers saved</span><strong>{attempts.length}</strong></div>
        <div><span>Correct</span><strong>{correct}</strong></div>
        <div><span>To revisit</span><strong>{incorrect}</strong></div>
        <div><span>Accuracy</span><strong>{accuracy === null ? 'No data' : `${accuracy}%`}</strong></div>
      </div>

      <div className="practice-topic-list">
        {questionTopics.map(({ topic, paper, subject, questions }) => {
          const topicAttempts = attempts.filter((attempt) => attempt.topicId === topic.id)
          const topicCorrect = topicAttempts.filter((attempt) => attempt.correct).length
          const topicAccuracy = topicAttempts.length ? Math.round((topicCorrect / topicAttempts.length) * 100) : null
          const progress = plan ? getTopicProgress(plan, topic.id) : undefined
          return (
            <article className="practice-topic-row" key={topic.id}>
              <div className="practice-topic-copy">
                <span>{paper?.title}</span>
                <h2>{topic.title}</h2>
                <p>{subject?.title} / {questions.length} original practice questions</p>
              </div>
              <div className="practice-topic-result">
                <span>{topicAttempts.length ? `${topicAccuracy}% accuracy` : 'Not attempted'}</span>
                <small>{progress?.status.replace('-', ' ') ?? 'not started'}</small>
              </div>
              <Button variant="outlined" onClick={() => navigate(`/study-plan?topic=${encodeURIComponent(topic.id)}`)}>Practice topic</Button>
            </article>
          )
        })}
        {!questionTopics.length && <p className="planner-empty-inline">No curated practice checks match this paper yet.</p>}
      </div>
    </Box>
  )
}
