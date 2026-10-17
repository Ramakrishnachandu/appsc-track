import { Box, Button, Card, CardContent, Chip, LinearProgress } from '@mui/material'
import { getConfiguredSyllabusData, todayTasks, weeklyHours } from '../data/dashboardData'
import { getOverallSubjectProgress, getUserSubjectProgress } from '../lib/userProgress'
import { useAppStore } from '../store/useAppStore'

export function DashboardPage() {
  const { user, dashboard, updateDashboard } = useAppStore()
  const { prelimsSubjects, mainsSubjects } = getConfiguredSyllabusData()
  const allSubjects = [...prelimsSubjects, ...mainsSubjects]
  const liveProgress = getUserSubjectProgress(user?.id ?? 'demo-user', allSubjects)
  const overallProgress = getOverallSubjectProgress(user?.id ?? 'demo-user', allSubjects)

  const stats = [
    { label: 'Overall progress', value: `${overallProgress}%`, detail: 'Target: 70%' },
    { label: 'Study streak', value: `${dashboard.studyStreak} days`, detail: 'Best: 18 days' },
    {
      label: 'MCQ accuracy',
      value: `${Math.round(liveProgress.reduce((sum, item) => sum + item.quizAccuracy, 0) / Math.max(liveProgress.length, 1))}%`,
      detail: '+8% this week',
    },
    {
      label: 'Avg. study hours',
      value: `${(liveProgress.reduce((sum, item) => sum + item.studyMinutes, 0) / Math.max(liveProgress.length, 1) / 60).toFixed(1)}h`,
      detail: 'Daily target: 4h',
    },
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
              {allSubjects.map((subject) => {
                const progress = liveProgress.find((item) => item.subjectId === subject.id)?.percent ?? subject.percent

                return (
                  <div key={subject.name} className="subject-row">
                    <div className="subject-name-row">
                      <span>{subject.name}</span>
                      <strong>{progress}%</strong>
                    </div>
                    <LinearProgress variant="determinate" value={progress} />
                  </div>
                )
              })}
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
