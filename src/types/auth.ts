export type UserRole = 'user' | 'admin'

export type AppUser = {
  id: string
  name: string
  email: string
  role: UserRole
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
