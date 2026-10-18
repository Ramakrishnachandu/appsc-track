import { useState } from 'react'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, LinearProgress, Typography } from '@mui/material'

type AppTourProps = {
  open: boolean
  onClose: () => void
  onVisit: (path: string) => void
}

const tourSteps = [
  {
    title: 'Welcome to APPSC Track',
    description: 'Use this workspace to turn your APPSC Group-II preparation into a steady, trackable routine. Your dashboard brings upcoming study work and progress together.',
    path: '/dashboard',
    action: 'Go to dashboard',
  },
  {
    title: 'Build a realistic study plan',
    description: 'Set the days and hours you can consistently study, choose your preparation preferences, and let the planner distribute syllabus topics across your available time.',
    path: '/study-plan',
    action: 'Open Study Plan',
  },
  {
    title: 'Track the official syllabus',
    description: 'Use the paper and topic map to decide what to study next. Update topic status as you progress so your plan and revision queue stay useful.',
    path: '/subjects',
    action: 'Open Subjects',
  },
  {
    title: 'Practice, then measure exam readiness',
    description: 'Use short practice checks for learning and mock tests for timed assessment. Only tests that meet the official-pattern requirements use the prescribed negative marking.',
    path: '/mock-tests',
    action: 'Open Mock Tests',
  },
  {
    title: 'Keep notes and revise on time',
    description: 'Save topic notes and source-attributed current affairs. Completed topics create spaced revision reminders so important material returns at planned intervals.',
    path: '/notes',
    action: 'Open Notes',
  },
  {
    title: 'Use results to choose your next step',
    description: 'Analytics highlights accuracy, weak areas, and recent attempts. Review those signals and adjust your next study sessions instead of relying on guesswork.',
    path: '/analytics',
    action: 'Open Analytics',
  },
]

export function AppTour({ open, onClose, onVisit }: AppTourProps) {
  const [stepIndex, setStepIndex] = useState(0)
  const step = tourSteps[stepIndex]

  const closeTour = () => {
    setStepIndex(0)
    onClose()
  }

  const visitFeature = () => {
    setStepIndex(0)
    onVisit(step.path)
  }

  return (
    <Dialog
      open={open}
      onClose={closeTour}
      aria-labelledby="app-tour-title"
      fullWidth
      maxWidth="sm"
      slotProps={{
        paper: {
          sx: {
            m: 1.5,
            maxHeight: 'calc(100dvh - 24px)',
            display: 'flex',
            flexDirection: 'column',
          },
        },
      }}
    >
      <DialogTitle id="app-tour-title" sx={{ flex: '0 0 auto' }}>{step.title}</DialogTitle>
      <DialogContent sx={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto' }}>
        <Typography color="text.secondary" sx={{ mb: 2 }}>{step.description}</Typography>
        <LinearProgress
          variant="determinate"
          value={((stepIndex + 1) / tourSteps.length) * 100}
          aria-label={`Tour step ${stepIndex + 1} of ${tourSteps.length}`}
        />
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          Step {stepIndex + 1} of {tourSteps.length}
        </Typography>
      </DialogContent>
      <DialogActions
        sx={{
          px: 3,
          pb: 2,
          flex: '0 0 auto',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
          gap: 1,
          '& > div': { display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 0.5 },
        }}
      >
        <Button type="button" sx={{ alignSelf: { xs: 'flex-start', sm: 'auto' } }} onClick={visitFeature}>{step.action}</Button>
        <div>
          <Button type="button" onClick={closeTour}>Skip tour</Button>
          {stepIndex > 0 && (
            <Button type="button" onClick={() => setStepIndex((index) => index - 1)}>Back</Button>
          )}
          <Button
            type="button"
            variant="contained"
            onClick={stepIndex === tourSteps.length - 1 ? closeTour : () => setStepIndex((index) => index + 1)}
          >
            {stepIndex === tourSteps.length - 1 ? 'Finish' : 'Next'}
          </Button>
        </div>
      </DialogActions>
    </Dialog>
  )
}
