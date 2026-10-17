import { useEffect, useState } from 'react'
import { Box, Button, Card, CardContent, LinearProgress } from '@mui/material'
import {
  getMockTestsFromApi,
  submitMockTestToApi,
} from '../lib/mockTestApi'
import {
  getStoredUserMockAttempts,
  saveStoredUserMockAttempts,
  type MockAttempt,
  type MockPaperType,
  type MockTest,
} from '../data/dashboardData'
import { useAppStore } from '../store/useAppStore'

export function MockTestsPage() {
  const { user } = useAppStore()
  const [tests, setTests] = useState<MockTest[]>([])
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null)
  const [selectedPaperType, setSelectedPaperType] = useState<'All' | MockPaperType>('All')
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [latestAttempt, setLatestAttempt] = useState<MockAttempt | null>(null)
  const [isStarted, setIsStarted] = useState(false)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [remainingSeconds, setRemainingSeconds] = useState(0)

  useEffect(() => {
    let isMounted = true

    void (async () => {
      const storedTests = await getMockTestsFromApi()
      if (!isMounted) return

      setTests(storedTests)
      if (storedTests[0]) {
        setSelectedTestId((current) => current || storedTests[0].id)
      }
    })()

    return () => {
      isMounted = false
    }
  }, [])

  const visibleTests = selectedPaperType === 'All' ? tests : tests.filter((test) => test.paperType === selectedPaperType)
  const currentTest = visibleTests.find((test) => test.id === selectedTestId) ?? visibleTests[0] ?? tests[0] ?? null
  const userAttempts = user ? getStoredUserMockAttempts(user.id) : []
  const computedResult = latestAttempt ?? (currentTest ? userAttempts.find((attempt) => attempt.testId === currentTest.id) ?? null : null)

  const currentQuestion = currentTest?.questions[questionIndex] ?? null
  const attemptedCount = currentTest ? currentTest.questions.filter((question) => typeof answers[question.id] === 'number').length : 0
  const unansweredCount = currentTest ? currentTest.questions.length - attemptedCount : 0
  const resultAccuracy = computedResult
    ? computedResult.accuracy ?? (computedResult.total ? Math.round((computedResult.score / computedResult.total) * 100) : 0)
    : 0

  useEffect(() => {
    if (!currentTest || !isStarted) return

    if (remainingSeconds <= 0) {
      void handleSubmit(true)
      return
    }

    const timer = window.setTimeout(() => {
      setRemainingSeconds((value) => value - 1)
    }, 1000)

    return () => window.clearTimeout(timer)
  }, [currentTest, isStarted, remainingSeconds])

  const startTest = () => {
    if (!currentTest) return

    setAnswers({})
    setQuestionIndex(0)
    setLatestAttempt(null)
    setIsStarted(true)
    setRemainingSeconds(currentTest.durationMinutes * 60)
  }

  const handleAnswerSelect = (questionId: string, value: number) => {
    setAnswers((current) => ({ ...current, [questionId]: value }))
  }

  const handleQuestionJump = (index: number) => {
    if (!currentTest) return
    setQuestionIndex(Math.min(Math.max(index, 0), currentTest.questions.length - 1))
  }

  const handleSubmit = async (autoSubmitted = false) => {
    if (!currentTest || !user) return

    const result = await submitMockTestToApi({ testId: currentTest.id, answers, userId: user.id })
    const attempt: MockAttempt = {
      id: `${currentTest.id}-${Date.now()}`,
      testId: result.testId,
      testTitle: result.testTitle,
      score: result.score,
      total: result.total,
      correct: result.correct,
      wrong: result.wrong,
      skipped: result.skipped,
      accuracy: result.accuracy,
      paperType: result.paperType,
      subjectName: currentTest.subjectName,
      submittedAt: result.submittedAt,
    }

    const nextAttempts = [attempt, ...userAttempts.filter((item) => item.testId !== currentTest.id)].slice(0, 12)
    saveStoredUserMockAttempts(user.id, nextAttempts)
    setLatestAttempt(attempt)
    setIsStarted(false)
    setRemainingSeconds(0)

    if (autoSubmitted) {
      setQuestionIndex(0)
    }
  }

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <Box className="page-shell">
      {!isStarted && (
        <Card className="panel-card mock-test-list-card">
          <CardContent>
            <div className="section-heading-row">
              <div>
                <span className="subject-detail-badge">Available tests</span>
                <h2>Choose your next assessment</h2>
              </div>
            </div>

            <div className="mock-test-summary-strip">
              <div className="summary-pill">
                <span>Tests</span>
                <strong>{tests.length}</strong>
              </div>
              <div className="summary-pill">
                <span>Duration</span>
                <strong>{currentTest ? `${currentTest.durationMinutes} min` : '—'}</strong>
              </div>
              <div className="summary-pill">
                <span>Exam pattern</span>
                <strong>MCQ</strong>
              </div>
            </div>

            <div className="filter-row">
              {(['All', 'Prelims', 'Mains'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  className={selectedPaperType === filter ? 'subject-filter active' : 'subject-filter'}
                  onClick={() => setSelectedPaperType(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>

            <div className="mock-test-grid">
              {visibleTests.map((test) => (
                <button
                  key={test.id}
                  type="button"
                  className={selectedTestId === test.id ? 'mock-test-card active' : 'mock-test-card'}
                  onClick={() => setSelectedTestId(test.id)}
                >
                  <div className="mock-test-card-top">
                    <span className="subject-tag">{test.paperType}</span>
                    <strong>{test.durationMinutes} min</strong>
                  </div>
                  <h3>{test.title}</h3>
                  <p>{test.subjectName}</p>
                  <div className="subject-progress-wrap">
                    <LinearProgress variant="determinate" value={Math.min(100, (test.questions.length / 10) * 100)} />
                  </div>
                  <div className="subject-progress-row">
                    <span>Questions</span>
                    <strong>{test.questions.length}</strong>
                  </div>
                </button>
              ))}
            </div>

            {currentTest && (
              <div className="mock-test-start-panel">
                <div>
                  <span className="subject-detail-badge">Selected test</span>
                  <h3>{currentTest.title}</h3>
                </div>
                <Button variant="contained" onClick={startTest}>Start test</Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {currentTest && (
        <Card className="panel-card assessment-panel-card">
          <CardContent>
            <div className="assessment-header-row">
              <div>
                <span className="subject-detail-badge">Assessment</span>
                <h2>{currentTest.title}</h2>
              </div>
              <div className="assessment-timer">{formatTime(remainingSeconds)}</div>
            </div>

            <div className="assessment-layout">
              <div className="assessment-main-panel">
                {currentQuestion && (
                  <>
                    <div className="assessment-question-meta">
                      <span>Question {questionIndex + 1}</span>
                      <span>{currentTest.questions.length} total</span>
                    </div>

                    <h3>{currentQuestion.prompt}</h3>

                    <div className="answer-options-grid">
                      {currentQuestion.options.map((option, index) => (
                        <button
                          key={`${currentQuestion.id}-${index}`}
                          type="button"
                          className={answers[currentQuestion.id] === index ? 'answer-option selected' : 'answer-option'}
                          onClick={() => handleAnswerSelect(currentQuestion.id, index)}
                        >
                          <span>{String.fromCharCode(65 + index)}</span>
                          {option}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                <div className="assessment-footer">
                  <Button variant="outlined" onClick={() => handleQuestionJump(questionIndex - 1)} disabled={questionIndex === 0}>Previous</Button>
                  <Button variant="outlined" onClick={() => handleQuestionJump(questionIndex + 1)} disabled={questionIndex >= currentTest.questions.length - 1}>Next</Button>
                  <Button variant="contained" color="success" onClick={() => void handleSubmit()}>Submit now</Button>
                </div>
              </div>

              <aside className="assessment-side-panel">
                <div className="assessment-side-header">Question navigator</div>
                <div className="assessment-question-grid">
                  {currentTest.questions.map((question, index) => (
                    <button
                      key={question.id}
                      type="button"
                      className={questionIndex === index ? 'assessment-question-dot active' : 'assessment-question-dot'}
                      onClick={() => handleQuestionJump(index)}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
                <div className="assessment-side-summary">
                  <div>
                    <span>Attempted</span>
                    <strong>{attemptedCount}</strong>
                  </div>
                  <div>
                    <span>Unanswered</span>
                    <strong>{unansweredCount}</strong>
                  </div>
                  <div>
                    <span>Accuracy</span>
                    <strong>{resultAccuracy}%</strong>
                  </div>
                </div>
              </aside>
            </div>
          </CardContent>
        </Card>
      )}
    </Box>
  )
}
