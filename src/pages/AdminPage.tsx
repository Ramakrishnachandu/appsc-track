import { useEffect, useState } from 'react'
import { Box, Button, Card, CardContent, TextField } from '@mui/material'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  getConfiguredSyllabusData,
  type MockPaperType,
  type MockQuestion,
  type MockTest,
} from '../data/dashboardData'
import {
  buildMockQuestionSet,
  deleteMockTestFromApi,
  getStoredMockDrafts,
  publishMockTestToApi,
  saveStoredMockDrafts,
  updateMockTestToApi,
} from '../lib/mockTestApi'
import {
  getStoredMockTests,
  hydrateSyllabusConfigFromSupabase,
  resetSyllabusData,
  saveSyllabusData,
  saveStoredMockTests,
} from '../data/dashboardData'

export function AdminPage({ initialSection }: { initialSection?: 'content' | 'mock' }) {
  const location = useLocation()
  const navigate = useNavigate()

  const resolvedSection: 'content' | 'mock' =
    initialSection ?? (location.pathname.includes('/mock') ? 'mock' : 'content')

  const [adminSection, setAdminSection] = useState<'content' | 'mock'>(resolvedSection)

  useEffect(() => {
    if (location.pathname.includes('/mock')) {
      setAdminSection('mock')
    } else if (location.pathname.includes('/content')) {
      setAdminSection('content')
    }
  }, [location.pathname])

  const defaultConfig = getConfiguredSyllabusData()
  const [config, setConfig] = useState(defaultConfig)

  useEffect(() => {
    let isMounted = true
    const syncRealApiContent = async () => {
      const live = await hydrateSyllabusConfigFromSupabase()
      if (isMounted && live && (live.prelimsSubjects.length > 0 || live.mainsSubjects.length > 0)) {
        setConfig(live)
      }
    }
    void syncRealApiContent()
    return () => {
      isMounted = false
    }
  }, [])
  const [selectedSubjectId, setSelectedSubjectId] = useState(defaultConfig.prelimsSubjects[0]?.id || '')
  const [statusMessage, setStatusMessage] = useState('')
  const [mockTests, setMockTests] = useState<MockTest[]>(() => getStoredMockTests())
  const [draftTests, setDraftTests] = useState<MockTest[]>(() => getStoredMockDrafts())
  const [editingTestId, setEditingTestId] = useState<string | null>(null)
  // const [adminSection, setAdminSection] = useState<'content' | 'mock'>(initialSection)

  type DraftQuestion = {
    prompt: string
    options: string[]
    correctIndex: number
    explanation: string
  }

  const createBlankQuestion = (): DraftQuestion => ({
    prompt: '',
    options: ['', '', '', ''],
    correctIndex: 0,
    explanation: '',
  })

  const [draftTest, setDraftTest] = useState({
    title: '',
    paperType: 'Prelims' as MockPaperType,
    subjectId: defaultConfig.prelimsSubjects[0]?.id ?? '',
    schedule: 'Daily' as 'Daily' | 'Weekly',
    durationMinutes: 30,
    count: 5,
  })
  const [customQuestions, setCustomQuestions] = useState<DraftQuestion[]>([createBlankQuestion()])

  const subjectOptions = [...config.prelimsSubjects, ...config.mainsSubjects]

  const resetMockDraftForm = () => {
    setEditingTestId(null)
    setDraftTest({
      title: '',
      paperType: 'Prelims',
      subjectId: defaultConfig.prelimsSubjects[0]?.id ?? '',
      schedule: 'Daily',
      durationMinutes: 30,
      count: 5,
    })
    setCustomQuestions([createBlankQuestion()])
  }

  useEffect(() => {
    setMockTests(getStoredMockTests())
  }, [])

  useEffect(() => {
    if (!draftTest.subjectId && subjectOptions[0]) {
      setDraftTest((current) => ({ ...current, subjectId: subjectOptions[0].id }))
    }
  }, [draftTest.subjectId, subjectOptions])

  const buildCustomQuestionSet = (): MockQuestion[] => {
    const selectedSubject = subjectOptions.find((subject) => subject.id === draftTest.subjectId) ?? subjectOptions[0]
    const typedQuestions: MockQuestion[] = []

    customQuestions.forEach((question, index) => {
      const prompt = question.prompt.trim()
      const options = question.options.map((option) => option.trim()).slice(0, 4)

      if (!prompt || options.every((option) => !option)) {
        return
      }

      const safeOptions = [...options]
      while (safeOptions.length < 4) {
        safeOptions.push('')
      }

      const correctIndex = Math.min(Math.max(Number(question.correctIndex) || 0, 0), 3)

      typedQuestions.push({
        id: `${selectedSubject?.id ?? 'custom'}-${draftTest.paperType.toLowerCase()}-${index + 1}`,
        subjectId: selectedSubject?.id ?? `${draftTest.paperType.toLowerCase()}-subject-${index + 1}`,
        subjectName: selectedSubject?.name ?? `${draftTest.paperType} subject ${index + 1}`,
        paperType: draftTest.paperType,
        prompt,
        options: safeOptions,
        correctIndex,
        explanation: question.explanation.trim() || 'Answer explained in the lesson notes.',
      })
    })

    return typedQuestions
  }

  const createMockTestFromDraft = (): MockTest => {
    const selectedSubject = subjectOptions.find((subject) => subject.id === draftTest.subjectId) ?? subjectOptions[0]
    if (!selectedSubject) {
      throw new Error('No subject selected for mock test')
    }

    const generatedQuestions = buildCustomQuestionSet()
    const finalQuestions = generatedQuestions.length > 0
      ? generatedQuestions
      : buildMockQuestionSet({
        paperType: draftTest.paperType,
        subjectId: selectedSubject.id,
        subjectName: selectedSubject.name,
        count: draftTest.count,
      })

    const generateId = () => {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID()
      }
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0
        const v = c === 'x' ? r : (r & 0x3) | 0x8
        return v.toString(16)
      })
    }

    return {
      id: editingTestId ?? generateId(),
      title: draftTest.title || `${draftTest.paperType} ${selectedSubject.name} Test`,
      schedule: draftTest.schedule,
      durationMinutes: draftTest.durationMinutes,
      createdAt: new Date().toISOString(),
      paperType: draftTest.paperType,
      subjectId: selectedSubject.id,
      subjectName: selectedSubject.name,
      source: 'api',
      questions: finalQuestions,
    }
  }

  const addMockTest = async () => {
    try {
      const nextTest = createMockTestFromDraft()
      const published = editingTestId ? await updateMockTestToApi(nextTest) : await publishMockTestToApi(nextTest)
      const nextTests = [published, ...mockTests.filter((item) => item.id !== published.id)]
      setMockTests(nextTests)
      saveStoredMockTests(nextTests)
      setStatusMessage(`${draftTest.paperType} mock test ${editingTestId ? 'updated' : 'published'} successfully.`)
      resetMockDraftForm()
    } catch {
      const nextTest = createMockTestFromDraft()
      const nextTests = [nextTest, ...mockTests.filter((item) => item.id !== nextTest.id)]
      setMockTests(nextTests)
      saveStoredMockTests(nextTests)
      setStatusMessage(`${draftTest.paperType} mock test saved locally for sync.`)
      resetMockDraftForm()
    }
  }

  const saveMockDraft = () => {
    try {
      const nextTest = createMockTestFromDraft()
      const nextDrafts = [nextTest, ...draftTests.filter((item) => item.id !== nextTest.id)]
      setDraftTests(nextDrafts)
      saveStoredMockDrafts(nextDrafts)
      setStatusMessage(`Draft saved for ${nextTest.title}.`)
      setEditingTestId(nextTest.id)
    } catch {
      setStatusMessage('Unable to save the draft. Select a subject first.')
    }
  }

  const loadMockDraft = (test: MockTest) => {
    setEditingTestId(test.id)
    setDraftTest({
      title: test.title,
      paperType: test.paperType,
      subjectId: test.subjectId ?? subjectOptions[0]?.id ?? '',
      schedule: test.schedule,
      durationMinutes: test.durationMinutes,
      count: Math.min(10, Math.max(1, test.questions.length || 5)),
    })
    setCustomQuestions(test.questions.map((question) => ({
      prompt: question.prompt,
      options: question.options,
      correctIndex: question.correctIndex,
      explanation: question.explanation,
    })))
    setStatusMessage(`Draft loaded: ${test.title}`)
  }

  const handleEditMockTest = (test: MockTest) => {
    setEditingTestId(test.id)
    setDraftTest({
      title: test.title,
      paperType: test.paperType,
      subjectId: test.subjectId ?? subjectOptions[0]?.id ?? '',
      schedule: test.schedule,
      durationMinutes: test.durationMinutes,
      count: Math.min(10, Math.max(1, test.questions.length || 5)),
    })
    setCustomQuestions(test.questions.map((question) => ({
      prompt: question.prompt,
      options: question.options,
      correctIndex: question.correctIndex,
      explanation: question.explanation,
    })))
    setAdminSection('mock')
    navigate('/admin/mock-tests')
    setStatusMessage(`Editing ${test.title}. Update changes and publish when ready.`)
  }

  const handleDeleteMockTest = async (testId: string) => {
    const confirmed = window.confirm('Delete this mock test? This action cannot be undone.')
    if (!confirmed) return

    try {
      await deleteMockTestFromApi(testId)
      setMockTests((current) => current.filter((item) => item.id !== testId))
      setDraftTests((current) => current.filter((item) => item.id !== testId))
      if (editingTestId === testId) {
        resetMockDraftForm()
      }
      setStatusMessage('Mock test deleted successfully.')
    } catch {
      setStatusMessage('Unable to delete this mock test right now.')
    }
  }

  const subjectGroups = [
    { title: 'Prelims', items: config.prelimsSubjects },
    { title: 'Mains', items: config.mainsSubjects },
  ]

  const selectedSubject = [...config.prelimsSubjects, ...config.mainsSubjects].find((subject) => subject.id === selectedSubjectId)

  useEffect(() => {
    if (!selectedSubject && config.prelimsSubjects[0]) {
      setSelectedSubjectId(config.prelimsSubjects[0].id)
    }
  }, [config, selectedSubject])

  const handleSubjectSelect = (group: 'Prelims' | 'Mains', id: string) => {
    void group
    setSelectedSubjectId(id)
  }

  const updateSelectedSubject = (field: 'name' | 'marks' | 'summary' | 'percent', value: string | number) => {
    if (!selectedSubject) return

    setConfig((current) => ({
      prelimsSubjects: current.prelimsSubjects.map((subject) =>
        subject.id === selectedSubject.id ? { ...subject, [field]: value } : subject,
      ),
      mainsSubjects: current.mainsSubjects.map((subject) =>
        subject.id === selectedSubject.id ? { ...subject, [field]: value } : subject,
      ),
    }))
  }

  const [newTopicText, setNewTopicText] = useState('')
  const [bulkMode, setBulkMode] = useState(false)
  const [bulkText, setBulkText] = useState('')

  const updateAllTopics = (nextTopics: string[]) => {
    if (!selectedSubject) return

    setConfig((current) => ({
      prelimsSubjects: current.prelimsSubjects.map((subject) =>
        subject.id === selectedSubject.id ? { ...subject, topics: nextTopics } : subject,
      ),
      mainsSubjects: current.mainsSubjects.map((subject) =>
        subject.id === selectedSubject.id ? { ...subject, topics: nextTopics } : subject,
      ),
    }))
  }

  const handleAddTopicCard = () => {
    const trimmed = newTopicText.trim()
    if (!trimmed || !selectedSubject) return
    updateAllTopics([...selectedSubject.topics, trimmed])
    setNewTopicText('')
  }

  const handleBulkAddTopics = () => {
    if (!bulkText.trim() || !selectedSubject) return
    const rawBlocks = bulkText.includes('\n\n')
      ? bulkText.split(/\n\s*\n/)
      : bulkText.split('\n')
    const parsed = rawBlocks.map((b) => b.trim()).filter(Boolean)
    if (parsed.length === 0) return
    updateAllTopics([...selectedSubject.topics, ...parsed])
    setBulkText('')
    setBulkMode(false)
  }

  const handleUpdateTopic = (index: number, value: string) => {
    if (!selectedSubject) return
    const updated = [...selectedSubject.topics]
    updated[index] = value
    updateAllTopics(updated)
  }

  const handleDeleteTopic = (index: number) => {
    if (!selectedSubject) return
    const updated = selectedSubject.topics.filter((_, i) => i !== index)
    updateAllTopics(updated)
  }

  const handleMoveTopic = (index: number, direction: 'up' | 'down') => {
    if (!selectedSubject) return
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= selectedSubject.topics.length) return
    const updated = [...selectedSubject.topics]
    const [item] = updated.splice(index, 1)
    updated.splice(targetIndex, 0, item)
    updateAllTopics(updated)
  }

  const handleSave = async () => {
    await saveSyllabusData(config)
    setStatusMessage('Syllabus data saved and applied across the app.')
  }

  const handleReset = async () => {
    const freshConfig = await resetSyllabusData()
    setConfig(freshConfig)
    setSelectedSubjectId(freshConfig.prelimsSubjects[0].id)
    setStatusMessage('Default syllabus data restored.')
  }

  return (
    <Box className="page-shell">
      <div className="admin-rail-shell">
        <aside className="admin-subnav-panel">
          <div className="admin-subnav-header">Admin menu</div>

          <NavLink
            to="/admin/content"
            className={() => (adminSection === 'content' ? 'admin-subnav-item active' : 'admin-subnav-item')}
          >
            Subjects Content configuration
          </NavLink>

          <NavLink
            to="/admin/mock-tests"
            className={() => (adminSection === 'mock' ? 'admin-subnav-item active' : 'admin-subnav-item')}
          >
            Mock test manager
          </NavLink>
        </aside>

        <Card className="panel-card admin-panel-card">
          <CardContent>
            <div className="admin-header-row">
              <div>
                <h2>Configuration panel</h2>
                <p>Manage syllabus cards, study focus content, and mock test publishing.</p>
              </div>
              <div className="admin-actions">
                {adminSection === 'content' && (
                  <>
                    <Button variant="contained" onClick={handleSave}>Save changes</Button>
                    <Button variant="outlined" onClick={handleReset}>Reset</Button>
                  </>
                )}
              </div>
            </div>

            {statusMessage && <div className="admin-status">{statusMessage}</div>}

            {adminSection === 'content' ? (
              <div className="admin-layout">
                <div className="admin-list-panel">
                  {subjectGroups.map((group) => (
                    <div key={group.title} className="admin-group-block">
                      <div className="admin-group-title">{group.title}</div>
                      <div className="admin-card-list">
                        {group.items.map((subject) => (
                          <button
                            key={subject.id}
                            type="button"
                            className={selectedSubjectId === subject.id ? 'admin-subject-card active' : 'admin-subject-card'}
                            onClick={() => handleSubjectSelect(group.title as 'Prelims' | 'Mains', subject.id)}
                          >
                            <span>{subject.name}</span>
                            <strong>{subject.percent}%</strong>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="admin-editor-panel">
                  {selectedSubject && (
                    <>
                      <TextField
                        label="Subject name"
                        value={selectedSubject.name}
                        onChange={(event) => updateSelectedSubject('name', event.target.value)}
                        fullWidth
                        margin="normal"
                      />

                      <TextField
                        label="Marks"
                        value={selectedSubject.marks}
                        onChange={(event) => updateSelectedSubject('marks', event.target.value)}
                        fullWidth
                        margin="normal"
                      />

                      <TextField
                        label="Progress %"
                        type="number"
                        value={selectedSubject.percent}
                        onChange={(event) => updateSelectedSubject('percent', Number(event.target.value) || 0)}
                        fullWidth
                        margin="normal"
                      />

                      <TextField
                        label="Summary"
                        value={selectedSubject.summary}
                        onChange={(event) => updateSelectedSubject('summary', event.target.value)}
                        fullWidth
                        multiline
                        rows={4}
                        margin="normal"
                      />

                      <div className="admin-topics-manager">
                        <div className="admin-topics-header">
                          <div>
                            <h3>Study focus topic cards</h3>
                            <p className="admin-topics-subtitle">
                              Add more cards for this subject. Paste any text (paragraphs, points, notes) in the input field below. Each card renders the text exactly as pasted.
                            </p>
                          </div>
                          <div className="admin-topics-badge">
                            {selectedSubject.topics.length} {selectedSubject.topics.length === 1 ? 'card' : 'cards'}
                          </div>
                        </div>

                        {/* Add new card box */}
                        <div className="admin-add-card-box">
                          <div className="admin-add-card-header">
                            <span className="admin-add-card-title">Add study focus topic card</span>
                            <Button
                              size="small"
                              variant="text"
                              onClick={() => setBulkMode(!bulkMode)}
                            >
                              {bulkMode ? 'Switch to single card' : 'Bulk paste multiple cards'}
                            </Button>
                          </div>

                          {bulkMode ? (
                            <div className="admin-bulk-input-block">
                              <TextField
                                label="Paste multiple topics (separated by empty line or newline)"
                                placeholder="Topic 1 content...&#10;&#10;Topic 2 content...&#10;&#10;Topic 3 content..."
                                value={bulkText}
                                onChange={(e) => setBulkText(e.target.value)}
                                fullWidth
                                multiline
                                rows={5}
                                margin="dense"
                              />
                              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                <Button
                                  variant="contained"
                                  size="small"
                                  onClick={handleBulkAddTopics}
                                  disabled={!bulkText.trim()}
                                >
                                  Add All As Cards
                                </Button>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  onClick={() => setBulkMode(false)}
                                >
                                  Cancel
                                </Button>
                              </Box>
                            </div>
                          ) : (
                            <div className="admin-single-input-block">
                              <TextField
                                label="Paste or type study focus topic text"
                                placeholder="Paste syllabus topic, notes, points, or paragraph here... Each card renders this text exactly as pasted."
                                value={newTopicText}
                                onChange={(e) => setNewTopicText(e.target.value)}
                                fullWidth
                                multiline
                                rows={3}
                                margin="dense"
                                onKeyDown={(e) => {
                                  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                                    e.preventDefault()
                                    handleAddTopicCard()
                                  }
                                }}
                              />
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                                <span className="admin-field-hint">Tip: Press Ctrl + Enter to quickly add this card</span>
                                <Button
                                  variant="contained"
                                  onClick={handleAddTopicCard}
                                  disabled={!newTopicText.trim()}
                                >
                                  + Add Topic Card
                                </Button>
                              </Box>
                            </div>
                          )}
                        </div>

                        {/* Existing cards list */}
                        <div className="admin-cards-list">
                          {selectedSubject.topics.length === 0 ? (
                            <div className="admin-cards-empty">
                              No study focus topic cards added yet. Paste text in the input field above and click <strong>+ Add Topic Card</strong>.
                            </div>
                          ) : (
                            selectedSubject.topics.map((topic, index) => (
                              <div key={index} className="admin-topic-card-item">
                                <div className="admin-topic-card-topbar">
                                  <span className="admin-topic-card-number">Card #{index + 1}</span>
                                  <div className="admin-topic-card-controls">
                                    <Button
                                      size="small"
                                      disabled={index === 0}
                                      onClick={() => handleMoveTopic(index, 'up')}
                                      title="Move up"
                                      sx={{ minWidth: 32, px: 1 }}
                                    >
                                      ▲
                                    </Button>
                                    <Button
                                      size="small"
                                      disabled={index === selectedSubject.topics.length - 1}
                                      onClick={() => handleMoveTopic(index, 'down')}
                                      title="Move down"
                                      sx={{ minWidth: 32, px: 1 }}
                                    >
                                      ▼
                                    </Button>
                                    <Button
                                      size="small"
                                      color="error"
                                      onClick={() => handleDeleteTopic(index)}
                                      title="Delete this card"
                                    >
                                      Delete
                                    </Button>
                                  </div>
                                </div>

                                <TextField
                                  label={`Card #${index + 1} Text`}
                                  value={topic}
                                  onChange={(e) => handleUpdateTopic(index, e.target.value)}
                                  fullWidth
                                  multiline
                                  rows={Math.min(Math.max(2, topic.split('\n').length), 6)}
                                  margin="dense"
                                />

                                <div className="admin-topic-card-preview-wrapper">
                                  <span className="admin-preview-label">Rendered Card Preview:</span>
                                  <div className="admin-card-preview-box">
                                    <span className="topic-dot" />
                                    <div className="topic-card-content">{topic || <em>Empty card</em>}</div>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <Box sx={{ mt: 1 }}>
                <h2>Mock test manager</h2>
                <div className="mock-test-admin-form">
                  <TextField
                    label="Title"
                    value={draftTest.title}
                    onChange={(event) => setDraftTest((current) => ({ ...current, title: event.target.value }))}
                    fullWidth
                    margin="normal"
                  />

                  <div className="mock-test-admin-grid">
                    <div className="native-select-field">
                      <label>Paper type</label>
                      <select
                        value={draftTest.paperType}
                        onChange={(event) => {
                          const nextPaperType = event.target.value as MockPaperType
                          const nextSubject = nextPaperType === 'Prelims'
                            ? config.prelimsSubjects[0]?.id ?? ''
                            : config.mainsSubjects[0]?.id ?? ''

                          setDraftTest((current) => ({
                            ...current,
                            paperType: nextPaperType,
                            subjectId: nextSubject,
                          }))
                        }}
                      >
                        <option value="Prelims">Prelims</option>
                        <option value="Mains">Mains</option>
                      </select>
                    </div>

                    <div className="native-select-field">
                      <label>Subject</label>
                      <select
                        value={draftTest.subjectId}
                        onChange={(event) => setDraftTest((current) => ({ ...current, subjectId: event.target.value }))}
                      >
                        {subjectOptions.map((subject) => (
                          <option key={subject.id} value={subject.id}>{subject.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="native-select-field">
                      <label>Schedule</label>
                      <select
                        value={draftTest.schedule}
                        onChange={(event) => setDraftTest((current) => ({ ...current, schedule: event.target.value as 'Daily' | 'Weekly' }))}
                      >
                        <option value="Daily">Daily</option>
                        <option value="Weekly">Weekly</option>
                      </select>
                    </div>

                    <TextField
                      label="Duration (min)"
                      type="number"
                      value={draftTest.durationMinutes}
                      onChange={(event) => setDraftTest((current) => ({ ...current, durationMinutes: Number(event.target.value) || 30 }))}
                      fullWidth
                      margin="normal"
                    />

                    <TextField
                      label="Question count"
                      type="number"
                      value={draftTest.count}
                      onChange={(event) => setDraftTest((current) => ({ ...current, count: Math.min(10, Math.max(1, Number(event.target.value) || 5)) }))}
                      fullWidth
                      margin="normal"
                    />
                  </div>

                  <div className="custom-questions-builder">
                    <div className="admin-header-row" style={{ marginBottom: 10 }}>
                      <div>
                        <h3 style={{ margin: 0 }}>Questions and options</h3>
                      </div>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => setCustomQuestions((current) => [...current, createBlankQuestion()])}
                      >
                        Add question
                      </Button>
                    </div>

                    {customQuestions.map((question, index) => (
                      <div key={`custom-question-${index}`} className="custom-question-card">
                        <div className="custom-question-header">
                          <strong>Question {index + 1}</strong>
                          {customQuestions.length > 1 && (
                            <Button
                              variant="text"
                              color="warning"
                              size="small"
                              onClick={() => setCustomQuestions((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                            >
                              Remove
                            </Button>
                          )}
                        </div>

                        <TextField
                          label="Question prompt"
                          value={question.prompt}
                          onChange={(event) => {
                            const nextValue = event.target.value
                            setCustomQuestions((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, prompt: nextValue } : item))
                          }}
                          fullWidth
                          margin="normal"
                        />

                        <div className="custom-options-grid">
                          {question.options.map((option, optionIndex) => (
                            <TextField
                              key={`${index}-option-${optionIndex}`}
                              label={`Option ${String.fromCharCode(65 + optionIndex)}`}
                              value={option}
                              onChange={(event) => {
                                const nextValue = event.target.value
                                setCustomQuestions((current) => current.map((item, itemIndex) =>
                                  itemIndex === index
                                    ? {
                                        ...item,
                                        options: item.options.map((choice, choiceIndex) => (
                                          choiceIndex === optionIndex ? nextValue : choice
                                        )),
                                      }
                                    : item,
                                ))
                              }}
                              fullWidth
                              margin="dense"
                            />
                          ))}
                        </div>

                        <div className="native-select-field" style={{ marginTop: 8 }}>
                          <label>Correct answer</label>
                          <select
                            value={question.correctIndex}
                            onChange={(event) => {
                              const nextValue = Number(event.target.value)
                              setCustomQuestions((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, correctIndex: nextValue } : item))
                            }}
                          >
                            {question.options.map((_, optionIndex) => (
                              <option key={`answer-${index}-${optionIndex}`} value={optionIndex}>
                                Option {String.fromCharCode(65 + optionIndex)}
                              </option>
                            ))}
                          </select>
                        </div>

                        <TextField
                          label="Explanation"
                          value={question.explanation}
                          onChange={(event) => {
                            const nextValue = event.target.value
                            setCustomQuestions((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, explanation: nextValue } : item))
                          }}
                          fullWidth
                          multiline
                          rows={2}
                          margin="normal"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="admin-actions" style={{ justifyContent: 'flex-start', marginBottom: 12, gap: 12 }}>
                    <Button variant="contained" onClick={() => void addMockTest()}>{editingTestId ? 'Update published test' : 'Publish mock test'}</Button>
                    <Button variant="outlined" onClick={saveMockDraft}>Save as draft</Button>
                    <Button variant="text" color="secondary" onClick={resetMockDraftForm}>Clear form</Button>
                  </div>
                </div>

                <div className="admin-header-row" style={{ marginTop: 16 }}>
                  <div>
                    <h3 style={{ margin: 0 }}>Drafts</h3>
                  </div>
                </div>
                <div className="subject-list">
                  {draftTests.length ? draftTests.map((test) => (
                    <div key={test.id} className="task-item">
                      <div>
                        <strong>{test.title}</strong>
                        <p>{test.paperType} • Draft • {test.questions.length} questions</p>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <Button size="small" variant="text" onClick={() => loadMockDraft(test)}>Load</Button>
                        <Button size="small" color="warning" variant="text" onClick={() => handleDeleteMockTest(test.id)}>Delete</Button>
                      </div>
                    </div>
                  )) : <p>No draft tests saved yet.</p>}
                </div>

                <div className="admin-header-row" style={{ marginTop: 16 }}>
                  <div>
                    <h3 style={{ margin: 0 }}>Published tests</h3>
                  </div>
                </div>
                <div className="subject-list">
                  {mockTests.map((test) => (
                    <div key={test.id} className="task-item">
                      <div>
                        <strong>{test.title}</strong>
                        <p>{test.paperType} • {test.schedule} • {test.questions.length} questions</p>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span>{test.durationMinutes} min</span>
                        <Button size="small" variant="text" onClick={() => handleEditMockTest(test)}>Edit</Button>
                        <Button size="small" color="warning" variant="text" onClick={() => handleDeleteMockTest(test.id)}>Delete</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Box>
            )}
          </CardContent>
        </Card>
      </div>
    </Box>
  )
}
