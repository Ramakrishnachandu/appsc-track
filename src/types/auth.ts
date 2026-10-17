export type AppUser = {
  id: string
  name: string
  email: string
}

export type DashboardState = {
  appName: string
  sessionName: string
  status: 'ready' | 'demo'
  overallProgress: number
  studyStreak: number
  mcqAccuracy: number
  dailyHours: number
  examCountdown: number
}
