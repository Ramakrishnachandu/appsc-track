import { Box, Card, CardContent } from '@mui/material'
import { studyPlan } from '../data/dashboardData'

export function StudyPlanPage() {
  return (
    <Box className="page-shell">
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
