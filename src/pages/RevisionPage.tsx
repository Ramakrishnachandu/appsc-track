import { Box, Card, CardContent } from '@mui/material'
import { revisionQueue } from '../data/dashboardData'

export function RevisionPage() {
  return (
    <Box className="page-shell">
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
