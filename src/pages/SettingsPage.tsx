import { Alert, Box, Button, Card, CardContent, CircularProgress } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { isSupabaseConfigured } from '../lib/supabase'
import { WEEKDAY_LABELS } from '../lib/studyPlanner'
import { useAppStore } from '../store/useAppStore'
import { useStudyPlanStore } from '../store/useStudyPlanStore'

export function SettingsPage() {
  const user = useAppStore((state) => state.user)
  const navigate = useNavigate()
  const plan = useStudyPlanStore((state) => state.plan)
  const loading = useStudyPlanStore((state) => state.loading)
  const error = useStudyPlanStore((state) => state.error)

  if (loading) return <Box className="page-shell planner-loading"><CircularProgress aria-label="Loading settings" /></Box>

  if (!plan) {
    return <Box className="page-shell"><Alert severity="error">{error ?? 'Your study preferences are not available yet.'}</Alert></Box>
  }

  const mediumLabels = { english: 'English', telugu: 'Telugu', bilingual: 'Telugu + English' }
  const targetDate = plan.settings.targetDate
    ? new Date(`${plan.settings.targetDate}T12:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Not set'
  const availableDays = plan.settings.dayAvailability
    .map((hours, day) => hours > 0 ? `${WEEKDAY_LABELS[day].slice(0, 3)} (${hours}h)` : null)
    .filter((day): day is string => day !== null)

  return (
    <Box className="page-shell">
      <Card className="panel-card">
        <CardContent>
          <ul className="list-inline">
            <li>Account: {user?.email}</li>
            <li>Preparation level: {plan.settings.level}</li>
            <li>Average study target: {plan.settings.dailyHours} hours per study day</li>
            <li>Weekly availability: {availableDays.join(', ') || 'Not configured'}</li>
            <li>Preferred study medium: {mediumLabels[plan.settings.medium]}</li>
            <li>Target date: {targetDate}</li>
            <li>{isSupabaseConfigured ? 'Planner sync: Supabase account storage' : 'Planner sync: this browser only (demo mode)'}</li>
          </ul>
          <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/study-plan')}>Adjust study plan</Button>
        </CardContent>
      </Card>
    </Box>
  )
}
