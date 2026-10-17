import {
  CheckCircleOutlined,
  HistoryOutlined,
  InsightsOutlined,
  TrendingUpOutlined,
  WarningAmberOutlined,
} from '@mui/icons-material'
import { Box, Card, CardContent } from '@mui/material'
import {
  getMonthlyPerformanceTrend,
  getStoredUserMockAttempts,
  getWeakAreas,
} from '../data/dashboardData'
import { useAppStore } from '../store/useAppStore'

export function AnalyticsPage() {
  const { user } = useAppStore()
  const userId = user?.id ?? 'demo-user'
  const attempts = getStoredUserMockAttempts(userId)
  const monthlyTrend = getMonthlyPerformanceTrend(userId)
  const weakAreas = getWeakAreas(userId)

  const overallAccuracy = attempts.length
    ? Math.round(attempts.reduce((sum, attempt) => sum + (attempt.accuracy ?? 0), 0) / attempts.length)
    : 0

  const latestAttempt = attempts[0]
  const totalQuestions = attempts.reduce((sum, attempt) => sum + (attempt.total || 0), 0)
  const totalCorrect = attempts.reduce((sum, attempt) => sum + (attempt.correct ?? attempt.score ?? 0), 0)

  const summaryCards = [
    {
      label: 'Overall accuracy',
      value: `${overallAccuracy}%`,
      subtext: 'Average across all attempts',
      icon: <TrendingUpOutlined fontSize="small" />,
    },
    {
      label: 'Questions solved',
      value: `${totalCorrect}`,
      subtext: 'Correct answers recorded',
      icon: <CheckCircleOutlined fontSize="small" />,
    },
    {
      label: 'Practice volume',
      value: `${totalQuestions}`,
      subtext: 'Questions attempted',
      icon: <HistoryOutlined fontSize="small" />,
    },
    {
      label: 'Focus risk',
      value: `${weakAreas[0]?.accuracy ?? 0}%`,
      subtext: weakAreas[0]?.subject ?? 'No active risk',
      icon: <WarningAmberOutlined fontSize="small" />,
    },
  ]

  return (
    <Box className="page-shell">
      <div className="analytics-summary-grid">
        {summaryCards.map((card) => (
          <Card key={card.label} className="panel-card analytics-summary-card">
            <CardContent>
              <div className="analytics-card-header">
                <div className="analytics-card-icon">{card.icon}</div>
                <span>{card.label}</span>
              </div>
              <div className="analytics-card-value">{card.value}</div>
              <p>{card.subtext}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="content-grid analytics-grid">
        <Card className="panel-card">
          <CardContent>
            <div className="analytics-section-heading">
              <h2>Monthly progress</h2>
              <div className="analytics-tag">{monthlyTrend.at(-1)?.percent ?? 0}% this month</div>
            </div>
            <div className="mini-bars">
              {monthlyTrend.map((item) => (
                <div key={`${item.month}-${item.percent}`} className="mini-bar-item">
                  <div className="mini-bar" style={{ height: `${Math.max(14, item.percent)}%` }} />
                  <span>{item.month}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="panel-card">
          <CardContent>
            <div className="analytics-section-heading">
              <h2>Weak areas</h2>
              <InsightsOutlined fontSize="small" />
            </div>
            <ul className="list-inline analytics-weak-list">
              {weakAreas.map((item) => (
                <li key={`${item.subject}-${item.accuracy}`}>{item.subject}: {item.action} ({item.accuracy}%)</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="panel-card">
        <CardContent>
          <div className="analytics-section-heading">
            <h2>Recent mock attempts</h2>
            <div className="analytics-tag">{attempts.length} tracked</div>
          </div>

          <div className="analytics-attempt-list">
            {attempts.length ? attempts.slice(0, 5).map((attempt) => (
              <div key={attempt.id} className="analytics-attempt-item">
                <div>
                  <strong>{attempt.testTitle}</strong>
                  <p>{attempt.paperType} • {attempt.subjectName}</p>
                </div>
                <div className="analytics-attempt-score">
                  <span>{attempt.score}/{attempt.total}</span>
                  <strong>{attempt.accuracy ?? 0}%</strong>
                </div>
              </div>
            )) : (
              <p className="analytics-empty-state">No mock attempts yet. Start a test to generate performance analytics.</p>
            )}
          </div>

          {latestAttempt && (
            <div className="analytics-latest-highlight">
              <div>
                <span>Latest attempt</span>
                <strong>{latestAttempt.testTitle}</strong>
              </div>
              <div>
                <span>Result</span>
                <strong>{latestAttempt.accuracy ?? 0}% accuracy</strong>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}
