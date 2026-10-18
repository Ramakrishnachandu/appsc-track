import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, Box, Button, Card, CardContent, CircularProgress, LinearProgress } from '@mui/material'
import {
  getMockTestsFromApi,
  getUserMockAttemptsFromApi,
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
  const [userAttempts, setUserAttempts] = useState<MockAttempt[]>([])
  const [latestAttempt, setLatestAttempt] = useState<MockAttempt | null>(null)
  const [isStarted, setIsStarted] = useState(false)
  const [isLoadingTests, setIsLoadingTests] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [attemptsError, setAttemptsError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const submitLock = useRef(false)
  const submitHandler = useRef<(autoSubmitted?: boolean) => Promise<void>>(async () => {})

  useEffect(() => {
    let isMounted = true

    void getMockTestsFromApi()
      .then((storedTests) => {
        if (!isMounted) return
        setTests(storedTests)
        if (storedTests[0]) setSelectedTestId(storedTests[0].id)
      })
      .catch((error: unknown) => {
        if (isMounted) setLoadError(error instanceof Error ? error.message : 'Unable to load mock tests.')
      })
      .finally(() => {
        if (isMounted) setIsLoadingTests(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!user?.id) return
    let isCurrentUser = true

    void getUserMockAttemptsFromApi(user.id)
      .then((attempts) => {
        if (!isCurrentUser) return
        setUserAttempts(attempts)
        setAttemptsError(null)
      })
      .catch((error: unknown) => {
        if (!isCurrentUser) return
        setUserAttempts(getStoredUserMockAttempts(user.id))
        setAttemptsError(error instanceof Error ? error.message : 'Unable to refresh saved results.')
      })

    return () => {
      isCurrentUser = false
    }
  }, [user?.id])

  const visibleTests = selectedPaperType === 'All' ? tests : tests.filter((test) => test.paperType === selectedPaperType)
  const currentTest = visibleTests.find((test) => test.id === selectedTestId) ?? visibleTests[0] ?? null
  const savedAttempt = currentTest ? userAttempts.find((attempt) => attempt.testId === currentTest.id) ?? null : null
  const currentQuestion = currentTest?.questions[questionIndex] ?? null
  const attemptedCount = currentTest ? currentTest.questions.filter((question) => typeof answers[question.id] === 'number').length : 0
  const unansweredCount = currentTest ? currentTest.questions.length - attemptedCount : 0
  const displayedAttempt = isStarted ? null : latestAttempt ?? savedAttempt
  const resultAccuracy = displayedAttempt
    ? displayedAttempt.accuracy ?? (displayedAttempt.total ? Math.round((displayedAttempt.score / displayedAttempt.total) * 100) : 0)
    : null
  const isReviewing = Boolean(latestAttempt && !isStarted)

  const handleSubmit = useCallback(async (autoSubmitted = false) => {
    if (!currentTest || !user || submitLock.current) return
    if (!autoSubmitted && unansweredCount > 0 && !window.confirm(`You have ${unansweredCount} unanswered question${unansweredCount === 1 ? '' : 's'}. Submit anyway?`)) return

    submitLock.current = true
    setIsSubmitting(true)
    setSubmitError(null)

    try {
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
        assessmentMode: result.assessmentMode,
        marksPerQuestion: result.marksPerQuestion,
        negativeMarksPerWrong: result.negativeMarksPerWrong,
        submittedAt: result.submittedAt,
      }

      const existingAttempts = getStoredUserMockAttempts(user.id)
      const nextAttempts = [attempt, ...existingAttempts.filter((item) => item.testId !== currentTest.id)].slice(0, 12)
      saveStoredUserMockAttempts(user.id, nextAttempts)
      setUserAttempts(nextAttempts)
      setAttemptsError(null)
      setLatestAttempt(attempt)
      setIsStarted(false)
      setRemainingSeconds(0)
      setQuestionIndex(0)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to submit this assessment. Please try again.')
    } finally {
      submitLock.current = false
      setIsSubmitting(false)
    }
  }, [answers, currentTest, unansweredCount, user])

  useEffect(() => {
    submitHandler.current = handleSubmit
  }, [handleSubmit])

  useEffect(() => {
    if (!isStarted) return

    const timer = window.setInterval(() => {
      setRemainingSeconds((seconds) => Math.max(0, seconds - 1))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [isStarted])

  useEffect(() => {
    if (isStarted && remainingSeconds === 0) {
      void submitHandler.current(true)
    }
  }, [isStarted, remainingSeconds])

  const startTest = () => {
    if (!currentTest || currentTest.questions.length === 0) return

    submitLock.current = false
    setAnswers({})
    setQuestionIndex(0)
    setLatestAttempt(null)
    setSubmitError(null)
    setRemainingSeconds(Math.max(1, currentTest.durationMinutes) * 60)
    setIsStarted(true)
  }

  const selectTest = (testId: string) => {
    setSelectedTestId(testId)
    setAnswers({})
    setQuestionIndex(0)
    setLatestAttempt(null)
    setSubmitError(null)
  }

  const selectPaperType = (paperType: 'All' | MockPaperType) => {
    const nextTests = paperType === 'All' ? tests : tests.filter((test) => test.paperType === paperType)
    setSelectedPaperType(paperType)
    setSelectedTestId(nextTests[0]?.id ?? null)
    setAnswers({})
    setQuestionIndex(0)
    setLatestAttempt(null)
    setSubmitError(null)
  }

  const handleQuestionJump = (index: number) => {
    if (!currentTest) return
    setQuestionIndex(Math.min(Math.max(index, 0), currentTest.questions.length - 1))
  }

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <Box className="page-shell">
      <Alert severity="info">
      Short practice sets remain practice-only. An assessment is shown as exam-pattern only when it has 150 questions, 150 minutes, and APPSC-source citations for every question; only that mode uses one-third negative marking. The app does not generate or verify official questions.
      </Alert>

      {loadError && <Alert severity="error">{loadError}</Alert>}
      {attemptsError && <Alert severity="warning">Saved results could not be refreshed: {attemptsError}</Alert>}

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
                <span>Assessment mode</span>
                <strong>{currentTest?.assessmentMode === 'official-pattern' ? 'Exam pattern' : 'Practice'}</strong>
              </div>
            </div>

            <div className="filter-row" aria-label="Filter tests by paper">
              {(['All', 'Prelims', 'Mains'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  className={selectedPaperType === filter ? 'subject-filter active' : 'subject-filter'}
                  aria-pressed={selectedPaperType === filter}
                  onClick={() => selectPaperType(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>

            {isLoadingTests ? (
              <div className="mock-test-loading"><CircularProgress aria-label="Loading mock tests" /></div>
            ) : visibleTests.length ? (
              <div className="mock-test-grid">
                {visibleTests.map((test) => {
                  const attempt = userAttempts.find((item) => item.testId === test.id)
                  return (
                    <button
                      key={test.id}
                      type="button"
                      className={currentTest?.id === test.id ? 'mock-test-card active' : 'mock-test-card'}
                      aria-pressed={currentTest?.id === test.id}
                      onClick={() => selectTest(test.id)}
                    >
                      <div className="mock-test-card-top">
                        <span className="subject-tag">{test.paperType}</span>
                        <span className="subject-tag">{test.assessmentMode === 'official-pattern' ? 'Exam pattern' : 'Practice'}</span>
                        <strong>{test.durationMinutes} min</strong>
                      </div>
                      <h3>{test.title}</h3>
                      <p>{test.subjectName}</p>
                      <div className="subject-progress-wrap">
                        <LinearProgress variant="determinate" value={Math.min(100, (test.questions.length / 10) * 100)} />
                      </div>
                      <div className="subject-progress-row">
                        <span>{test.questions.length} questions</span>
                        {attempt && <strong>Last score: {attempt.score}/{attempt.total}</strong>}
                      </div>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="mock-test-empty-state">
                <h3>{tests.length ? 'No tests for this paper yet' : 'No mock tests available'}</h3>
                <p>{tests.length ? 'Choose another paper type to see available assessments.' : 'Published mock tests will appear here when they are available.'}</p>
              </div>
            )}

            {currentTest && (
              <div className="mock-test-start-panel">
                <div>
                  <span className="subject-detail-badge">Selected test</span>
                  <h3>{currentTest.title}</h3>
                  <p>
                    {currentTest.questions.length} questions · {currentTest.durationMinutes} minutes
                    {currentTest.assessmentMode === 'official-pattern' ? ' · 1/3 mark deducted per wrong answer' : ' · no negative marking'}
                  </p>
                </div>
                <Button variant="contained" onClick={startTest} disabled={isLoadingTests || currentTest.questions.length === 0}>
                  Start assessment
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {currentTest && (isStarted || latestAttempt) && (
        <Card className="panel-card assessment-panel-card">
          <CardContent>
            <div className="assessment-header-row">
              <div>
                <span className="subject-detail-badge">{isReviewing ? 'Assessment review' : 'Assessment in progress'}</span>
                <h2>{currentTest.title}</h2>
                <p className="assessment-scoring-note">
                  {currentTest.assessmentMode === 'official-pattern'
                    ? 'Exam-pattern scoring: +1 for correct, −1/3 for wrong, 0 for unanswered.'
                    : 'Practice scoring: +1 for correct, 0 for wrong or unanswered.'}
                </p>
              </div>
              <div className={remainingSeconds <= 60 && isStarted ? 'assessment-timer urgent' : 'assessment-timer'} aria-live="polite">
                {isStarted ? formatTime(remainingSeconds) : 'Submitted'}
                {isStarted && <span>Time remaining</span>}
              </div>
            </div>

            {latestAttempt && !isStarted && (
              <Alert severity="success" className="assessment-result-banner">
                Assessment submitted. You scored <strong>{latestAttempt.score} of {latestAttempt.total}</strong> ({resultAccuracy}% accuracy).
                {latestAttempt.negativeMarksPerWrong ? ` ${latestAttempt.wrong} incorrect answer${latestAttempt.wrong === 1 ? '' : 's'} incurred a one-third-mark penalty each.` : ''}
              </Alert>
            )}
            {submitError && <Alert severity="error" className="assessment-result-banner">{submitError}</Alert>}

            <div className="assessment-layout">
              <div className="assessment-main-panel">
                {currentQuestion && (
                  <>
                    <div className="assessment-question-meta">
                      <span>Question {questionIndex + 1} of {currentTest.questions.length}</span>
                      <span>{typeof answers[currentQuestion.id] === 'number' ? 'Answered' : 'Not answered'}</span>
                    </div>

                    <h3>{currentQuestion.prompt}</h3>

                    <div className="answer-options-grid" role="group" aria-label={`Answer options for question ${questionIndex + 1}`}>
                      {currentQuestion.options.map((option, index) => {
                        const isSelected = answers[currentQuestion.id] === index
                        const isCorrect = isReviewing && currentQuestion.correctIndex === index
                        const isIncorrectSelection = isReviewing && isSelected && !isCorrect
                        const optionClass = [
                          'answer-option',
                          isSelected ? 'selected' : '',
                          isCorrect ? 'correct' : '',
                          isIncorrectSelection ? 'incorrect' : '',
                        ].filter(Boolean).join(' ')
                        return (
                          <button
                            key={`${currentQuestion.id}-${index}`}
                            type="button"
                            className={optionClass}
                            aria-pressed={isSelected}
                            disabled={!isStarted || isSubmitting}
                            onClick={() => setAnswers((current) => ({ ...current, [currentQuestion.id]: index }))}
                          >
                            <span>{String.fromCharCode(65 + index)}</span>
                            {option}
                          </button>
                        )
                      })}
                    </div>
                    {isReviewing && <p className="assessment-explanation"><strong>Explanation:</strong> {currentQuestion.explanation}</p>}
                    {isReviewing && currentQuestion.sourceTitle && (
                      <p className="assessment-explanation">
                        <strong>Source:</strong> {currentQuestion.sourceTitle}
                        {currentQuestion.sourcePublishedAt && ` · ${currentQuestion.sourcePublishedAt}`}
                        {currentQuestion.sourceUrl && <> · <a href={currentQuestion.sourceUrl} target="_blank" rel="noreferrer">Open source</a></>}
                      </p>
                    )}
                  </>
                )}

                <div className="assessment-footer">
                  <Button variant="outlined" onClick={() => handleQuestionJump(questionIndex - 1)} disabled={questionIndex === 0}>Previous</Button>
                  <Button variant="outlined" onClick={() => handleQuestionJump(questionIndex + 1)} disabled={questionIndex >= currentTest.questions.length - 1}>Next</Button>
                  {isStarted ? (
                    <Button variant="contained" color="success" onClick={() => void handleSubmit()} disabled={isSubmitting}>
                      {isSubmitting ? 'Submitting…' : 'Submit assessment'}
                    </Button>
                  ) : (
                    <Button variant="contained" onClick={startTest}>Retake assessment</Button>
                  )}
                </div>
              </div>

              <aside className="assessment-side-panel" aria-label="Assessment question navigator">
                <div className="assessment-side-header">Question navigator</div>
                <div className="assessment-question-grid">
                  {currentTest.questions.map((question, index) => {
                    const questionAnswered = typeof answers[question.id] === 'number'
                    const questionClass = [
                      'assessment-question-dot',
                      questionIndex === index ? 'active' : '',
                      questionAnswered ? 'answered' : '',
                    ].filter(Boolean).join(' ')
                    return (
                      <button
                        key={question.id}
                        type="button"
                        className={questionClass}
                        aria-label={`Go to question ${index + 1}${questionAnswered ? ', answered' : ', unanswered'}`}
                        aria-current={questionIndex === index ? 'step' : undefined}
                        onClick={() => handleQuestionJump(index)}
                      >
                        {index + 1}
                      </button>
                    )
                  })}
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
                    <span>{displayedAttempt ? 'Accuracy' : 'Status'}</span>
                    <strong>{resultAccuracy === null ? 'In progress' : `${resultAccuracy}%`}</strong>
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
