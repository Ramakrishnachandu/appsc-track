import { Box, Button, Card, CardContent } from '@mui/material'
import { useAppStore } from '../store/useAppStore'

export function SettingsPage() {
  const { user, dashboard, updateDashboard } = useAppStore()

  return (
    <Box className="page-shell">
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
