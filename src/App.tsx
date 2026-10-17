import { useEffect, useRef, useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  LinearProgress,
  TextField,
  Typography,
} from '@mui/material'
import appscLogo from './assets/appsc-logo.svg'
import {
  getConfiguredSyllabusData,
  hydrateSyllabusConfigFromSupabase,
  monthlyProgress,
  practiceMetrics,
  resetSyllabusData,
  revisionQueue,
  saveSyllabusData,
  studyPlan,
  todayTasks,
  weeklyHours,
} from './data/dashboardData'
import { useAppStore } from './store/useAppStore'
import './App.css'

function DashboardPage() {
  const { user, dashboard, updateDashboard } = useAppStore()
  const { prelimsSubjects: configuredPrelims, mainsSubjects: configuredMains } = getConfiguredSyllabusData()
  const configuredSubjectProgress = configuredPrelims.concat(configuredMains)

  const stats = [
    { label: 'Overall progress', value: `${dashboard.overallProgress}%`, detail: 'Target: 70%' },
    { label: 'Study streak', value: `${dashboard.studyStreak} days`, detail: 'Best: 18 days' },
    { label: 'MCQ accuracy', value: `${dashboard.mcqAccuracy}%`, detail: '+8% this week' },
    { label: 'Avg. study hours', value: `${dashboard.dailyHours}h`, detail: 'Daily target: 4h' },
  ]

  return (
    <Box className="page-shell">
      <Box className="hero-panel">
        <Box>
          <Chip label="APPSC GROUP 2 PREPARATION" color="primary" variant="outlined" />
          <h1 className="page-title">Welcome, {user?.name || 'Student'}</h1>
        </Box>

        <Box className="countdown-box">
          <span>Exam countdown</span>
          <strong>{dashboard.examCountdown} days</strong>
        </Box>
      </Box>

      <Box className="stats-grid">
        {stats.map((item) => (
          <Card key={item.label} className="stat-card">
            <CardContent>
              <div className="stat-label">{item.label}</div>
              <div className="stat-value">{item.value}</div>
              <div className="stat-detail">{item.detail}</div>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Box className="content-grid">
        <Card className="panel-card">
          <CardContent>
            <h2>Today’s target</h2>
            <div className="task-list">
              {todayTasks.map((task) => (
                <div key={task.title} className="task-item">
                  <div>
                    <strong>{task.title}</strong>
                    <p>{task.subtitle}</p>
                  </div>
                  <span>{task.duration}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="panel-card">
          <CardContent>
            <h2>Today’s progress</h2>
            <div className="progress-block">
              <LinearProgress variant="determinate" value={72} className="progress-bar" />
              <div className="progress-meta">
                <strong>2h 52m / 4h</strong>
                <span>72% completed</span>
              </div>
            </div>
            <Button
              variant="contained"
              sx={{ mt: 2 }}
              onClick={() =>
                updateDashboard({
                  ...dashboard,
                  overallProgress: Math.min(100, dashboard.overallProgress + 3),
                  status: 'ready',
                })
              }
            >
              Update progress
            </Button>
          </CardContent>
        </Card>
      </Box>

      <Box className="content-grid">
        <Card className="panel-card">
          <CardContent>
            <h2>Subject progress</h2>
            <div className="subject-list">
              {configuredSubjectProgress.map((subject) => (
                <div key={subject.name} className="subject-row">
                  <div className="subject-name-row">
                    <span>{subject.name}</span>
                    <strong>{subject.percent}%</strong>
                  </div>
                  <LinearProgress variant="determinate" value={subject.percent} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="panel-card">
          <CardContent>
            <h2>Weekly performance</h2>
            <div className="bar-chart">
              {weeklyHours.map((hour) => (
                <div key={hour.day} className="bar-column">
                  <div className="bar" style={{ height: `${(hour.value / 5.5) * 100}%` }} />
                  <span>{hour.day}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}

function StudyPlanPage() {
  return (
    <Box className="page-shell">
      <h1 className="page-title">Study plan</h1>
      <Card className="panel-card">
        <CardContent>
          <div className="plan-list">
            {studyPlan.map((item) => (
              <div key={item.day} className="plan-item">
                <div className="plan-day">{item.day}</div>
                <div className="plan-detail">
                  <strong>{item.topic}</strong>
                  <span>{item.duration}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </Box>
  )
}

function SubjectsPage() {
  const { prelimsSubjects: configuredPrelims, mainsSubjects: configuredMains } = getConfiguredSyllabusData()
  const allSubjects = [...configuredPrelims, ...configuredMains]
  const subjectGroups = [
    { title: 'Prelims', items: configuredPrelims },
    { title: 'Mains', items: configuredMains },
  ]

  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(allSubjects[0]?.id ?? null)
  const [activeFilter, setActiveFilter] = useState<'All' | 'Prelims' | 'Mains'>('All')
  const detailRef = useRef<HTMLDivElement | null>(null)

  const visibleGroups = subjectGroups.filter((group) => activeFilter === 'All' || group.title === activeFilter)
  const visibleSubjects = visibleGroups.flatMap((group) => group.items)
  const selectedSubject = allSubjects.find((subject) => subject.id === selectedSubjectId) || visibleSubjects[0] || null

  useEffect(() => {
    if (visibleSubjects.length === 0) {
      return
    }

    if (!selectedSubjectId || !visibleSubjects.some((subject) => subject.id === selectedSubjectId)) {
      setSelectedSubjectId(visibleSubjects[0].id)
    }
  }, [selectedSubjectId, visibleSubjects])

  useEffect(() => {
    if (detailRef.current) {
      detailRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [selectedSubjectId, activeFilter])

  return (
    <Box className="page-shell">
      <h1 className="page-title">Subjects</h1>

      <Card className="panel-card exam-pattern-card">
        <CardContent>
          <div className="exam-pattern-header">
            <h2>APPSC Group II Exam Pattern</h2>
          </div>

          <div className="exam-pattern-grid">
            <div className="pattern-pill">
              <span>Prelims</span>
              <strong>4 sections</strong>
            </div>
            <div className="pattern-pill">
              <span>Mains</span>
              <strong>2 papers</strong>
            </div>
            <div className="pattern-pill">
              <span>Weightage</span>
              <strong>150 + 150 marks</strong>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="subject-filter-row">
        {(['All', 'Prelims', 'Mains'] as const).map((filter) => (
          <button
            key={filter}
            type="button"
            className={activeFilter === filter ? 'subject-filter active' : 'subject-filter'}
            onClick={() => setActiveFilter(filter)}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="subject-group-grid">
        {visibleGroups.map((group) => (
          <Card key={group.title} className="panel-card compact-card subject-group-card">
            <CardContent>
              <div className="subject-group-header">
                <h2>{group.title}</h2>
                <span>{group.items.length} subjects</span>
              </div>

              <div className="subject-list subject-card-list">
                {group.items.map((subject) => (
                  <button
                    key={subject.id}
                    type="button"
                    className={selectedSubjectId === subject.id ? 'subject-card active' : 'subject-card'}
                    onClick={() => setSelectedSubjectId(subject.id)}
                  >
                    <div className="subject-card-top">
                      <span className="subject-tag">{subject.marks}</span>
                      <strong>{subject.percent}%</strong>
                    </div>
                    <h3>{subject.name}</h3>
                    <p>{subject.summary}</p>
                    <div className="subject-progress-wrap">
                      <LinearProgress variant="determinate" value={subject.percent} className="subject-progress-bar" />
                    </div>
                    <div className="subject-progress-row">
                      <span>Readiness</span>
                      <strong>{subject.percent}%</strong>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedSubject && (
        <div ref={detailRef}>
          <Card className="panel-card subject-detail-panel">
            <CardContent>
              <div className="subject-detail-header">
                <div>
                  <span className="subject-detail-badge">Study focus</span>
                  <h2>{selectedSubject.name}</h2>
                </div>
                <span className="subject-detail-mark">{selectedSubject.marks}</span>
              </div>

              <p className="subject-detail-summary">{selectedSubject.summary}</p>

              <div className="subject-topic-list">
                {selectedSubject.topics.map((topic) => (
                  <div key={topic} className="subject-topic-item">
                    <span className="topic-dot" />
                    <span>{topic}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Box>
  )
}

function AdminPage() {
  const defaultConfig = getConfiguredSyllabusData()
  const [config, setConfig] = useState(defaultConfig)
  const [selectedSubjectId, setSelectedSubjectId] = useState(defaultConfig.prelimsSubjects[0]?.id || '')
  const [statusMessage, setStatusMessage] = useState('')

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

  const updateTopics = (value: string) => {
    if (!selectedSubject) return

    setConfig((current) => ({
      prelimsSubjects: current.prelimsSubjects.map((subject) =>
        subject.id === selectedSubject.id ? { ...subject, topics: value.split('\n').map((line) => line.trim()).filter(Boolean) } : subject,
      ),
      mainsSubjects: current.mainsSubjects.map((subject) =>
        subject.id === selectedSubject.id ? { ...subject, topics: value.split('\n').map((line) => line.trim()).filter(Boolean) } : subject,
      ),
    }))
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
      <h1 className="page-title">Admin</h1>

      <Card className="panel-card admin-panel-card">
        <CardContent>
          <div className="admin-header-row">
            <div>
              <h2>Content configuration</h2>
              <p>Manage syllabus cards and study focus topics without changing the app layout.</p>
            </div>
            <div className="admin-actions">
              <Button variant="contained" onClick={handleSave}>Save changes</Button>
              <Button variant="outlined" onClick={handleReset}>Reset</Button>
            </div>
          </div>

          {statusMessage && <div className="admin-status">{statusMessage}</div>}

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

                  <TextField
                    label="Study focus topics (one per line)"
                    value={selectedSubject.topics.join('\n')}
                    onChange={(event) => updateTopics(event.target.value)}
                    fullWidth
                    multiline
                    rows={10}
                    margin="normal"
                  />
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Box>
  )
}

function PracticePage() {
  return (
    <Box className="page-shell">
      <h1 className="page-title">Practice</h1>
      <div className="stats-grid small-grid">
        {practiceMetrics.map((metric) => (
          <Card key={metric.label} className="stat-card">
            <CardContent>
              <div className="stat-label">{metric.label}</div>
              <div className="stat-value">{metric.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </Box>
  )
}

function RevisionPage() {
  return (
    <Box className="page-shell">
      <h1 className="page-title">Revision</h1>
      <Card className="panel-card">
        <CardContent>
          <div className="revision-list">
            {revisionQueue.map((item, index) => (
              <div key={item} className="revision-item">
                <span className="revision-index">{index + 1}</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </Box>
  )
}

function AnalyticsPage() {
  return (
    <Box className="page-shell">
      <h1 className="page-title">Analytics</h1>
      <div className="content-grid">
        <Card className="panel-card">
          <CardContent>
            <h2>Monthly progress</h2>
            <div className="mini-bars">
              {monthlyProgress.map((item) => (
                <div key={item.month} className="mini-bar-item">
                  <div className="mini-bar" style={{ height: `${item.percent}%` }} />
                  <span>{item.month}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="panel-card">
          <CardContent>
            <h2>Weak areas</h2>
            <ul className="list-inline">
              <li>Economy</li>
              <li>Science & Tech</li>
              <li>Current Affairs revision</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </Box>
  )
}

function NotesPage() {
  return (
    <Box className="page-shell">
      <h1 className="page-title">Notes</h1>
      <Card className="panel-card">
        <CardContent>
          <ul className="list-inline">
            <li>Fundamental Rights</li>
            <li>AP Reorganisation</li>
            <li>GST and economy basics</li>
            <li>Telugu summary notes</li>
          </ul>
        </CardContent>
      </Card>
    </Box>
  )
}

function SettingsPage() {
  const { user, dashboard, updateDashboard } = useAppStore()

  return (
    <Box className="page-shell">
      <h1 className="page-title">Settings</h1>
      <Card className="panel-card">
        <CardContent>
          <ul className="list-inline">
            <li>Account: {user?.email}</li>
            <li>Daily target: 4 hours</li>
            <li>Medium: Telugu + English</li>
            <li>Exam date: March 2027</li>
            <li>Supabase ready for sync</li>
          </ul>
          <Button
            variant="outlined"
            sx={{ mt: 2 }}
            onClick={() =>
              updateDashboard({
                ...dashboard,
                sessionName: `${user?.name || 'Student'} session`,
                status: 'ready',
              })
            }
          >
            Save user settings
          </Button>
        </CardContent>
      </Card>
    </Box>
  )
}

const navItems = ['Dashboard', 'Study Plan', 'Subjects', 'Practice', 'Revision', 'Analytics', 'Notes', 'Settings', 'Admin']

function App() {
  const { user, authMode, loading, error, setAuthMode, login, register, logout, hydrateSession } = useAppStore()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [activeSection, setActiveSection] = useState('Dashboard')
  const [, setSyllabusRefreshSeed] = useState(0)

  useEffect(() => {
    void hydrateSession()
  }, [hydrateSession])

  useEffect(() => {
    let isMounted = true

    void (async () => {
      await hydrateSyllabusConfigFromSupabase()
      if (isMounted) {
        setSyllabusRefreshSeed((value) => value + 1)
      }
    })()

    return () => {
      isMounted = false
    }
  }, [])

  const handleSubmit = async () => {
    try {
      if (authMode === 'register') {
        await register({ name, email, password })
      } else {
        await login({ email, password })
      }
    } catch {
      // error is already set in the store
    }
  }

  if (!user) {
    return (
      <div className="auth-shell">
        <div className="auth-panel">
          <div className="auth-visual">
            <div className="brand-badge">
              <img src={appscLogo} alt="APPSC logo" className="appsc-logo" />
            </div>

            <Typography variant="overline" className="auth-kicker">
              APPSC GROUP 2 PREPARATION
            </Typography>

            <Typography variant="h2" className="visual-title">
              Prepare smarter with your personal study dashboard.
            </Typography>

            <Typography className="visual-subtitle">
              Track your daily targets, subject progress, revisions, and mock performance in one focused place.
            </Typography>

            <ul className="feature-list">
              <li>Daily progress tracking</li>
              <li>Subject-wise preparation insights</li>
              <li>Revision planner and performance analytics</li>
            </ul>
          </div>

          <Card className="auth-card">
            <CardContent className="auth-card-content">
              <div className="auth-header-row">
                <Typography variant="h4" className="auth-title">
                  {authMode === 'login' ? 'Welcome back' : 'Create your account'}
                </Typography>
                <span className="status-pill">{authMode === 'login' ? 'Secure access' : 'New profile'}</span>
              </div>

              <Typography className="auth-subtitle">
                {authMode === 'login'
                  ? 'Login to continue your APPSC journey.'
                  : 'Set up your APPSC preparation profile to begin.'}
              </Typography>

              <Box className="auth-form">
                {authMode === 'register' && (
                  <TextField
                    label="Full name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    fullWidth
                  />
                )}

                <TextField
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  fullWidth
                />

                <TextField
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  fullWidth
                />

                {error && <Typography color="error">{error}</Typography>}

                <Button variant="contained" size="large" onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Please wait...' : authMode === 'login' ? 'Login' : 'Register'}
                </Button>

                <Button
                  variant="text"
                  className="switch-auth-btn"
                  onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                >
                  {authMode === 'login' ? 'Create an account' : 'Already have an account? Login'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const renderPage = () => {
    switch (activeSection) {
      case 'Study Plan':
        return <StudyPlanPage />
      case 'Subjects':
        return <SubjectsPage />
      case 'Practice':
        return <PracticePage />
      case 'Revision':
        return <RevisionPage />
      case 'Analytics':
        return <AnalyticsPage />
      case 'Notes':
        return <NotesPage />
      case 'Settings':
        return <SettingsPage />
      case 'Admin':
        return <AdminPage />
      default:
        return <DashboardPage />
    }
  }

  const userInitials = (user?.name || 'Student')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-inner">
          <div className="brand">APPSC_TRACK</div>

          <div className="user-profile-card">
            <div className="user-avatar">{userInitials}</div>
            <div className="user-meta">
              <span className="user-name">{user?.name || 'Student'}</span>
              <span className="user-email">{user?.email || 'student@appsc.com'}</span>
            </div>
          </div>

          <Divider />

          <nav className="nav-list">
            {navItems.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setActiveSection(item)}
                className={activeSection === item ? 'nav-item active' : 'nav-item'}
              >
                {item}
              </button>
            ))}
          </nav>

          <div className="sidebar-footer">
            <Button variant="outlined" color="inherit" onClick={() => void logout()} className="logout-button">
              Logout
            </Button>
          </div>
        </div>
      </aside>

      <main className="main-panel">{renderPage()}</main>
    </div>
  )
}

export default App
