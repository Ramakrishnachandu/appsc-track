import {
  AssignmentTurnedInOutlined,
  CancelOutlined,
  CheckCircleOutlined,
  SkipNextOutlined,
} from '@mui/icons-material'
import { Box, Card, CardContent } from '@mui/material'
import { getPracticeMetrics } from '../data/dashboardData'
import { useAppStore } from '../store/useAppStore'

export function PracticePage() {
  const { user } = useAppStore()
  const metrics = getPracticeMetrics(user?.id ?? 'demo-user')

  const metricIcons = {
    Attempted: <AssignmentTurnedInOutlined fontSize="small" />,
    Correct: <CheckCircleOutlined fontSize="small" />,
    Wrong: <CancelOutlined fontSize="small" />,
    Skipped: <SkipNextOutlined fontSize="small" />,
  }

  return (
    <Box className="page-shell">
      <div className="stats-grid small-grid">
        {metrics.map((metric) => (
          <Card key={metric.label} className="stat-card practice-metric-card">
            <CardContent>
              <div className="practice-metric-header">
                <div className="practice-metric-icon" data-tone={metric.label.toLowerCase()}>
                  {metricIcons[metric.label]}
                </div>
                <span className="stat-label">{metric.label}</span>
              </div>
              <div className="stat-value">{metric.value}</div>
              <div className="stat-detail">{metric.detail}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </Box>
  )
}
