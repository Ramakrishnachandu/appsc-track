import { getExamCountdown } from '../data/dashboardData'
import type { AppUser, DashboardState } from '../types/auth'

export const demoUsersKey = 'appsc_demo_users'
export const demoSessionKey = 'appsc_demo_session'

const defaultDashboard: DashboardState = {
  appName: 'APPSC_TRACK',
  sessionName: 'My Study Session',
  status: 'demo',
  overallProgress: 42,
  studyStreak: 12,
  mcqAccuracy: 76,
  dailyHours: 4.2,
  examCountdown: getExamCountdown(),
}

export const getDemoUsers = (): Array<{ id: string; name: string; email: string; password: string; role: 'user' | 'admin' }> => {
  const raw = localStorage.getItem(demoUsersKey)

  if (!raw) {
    const seeded = [
      {
        id: 'demo-user-1',
        name: 'Demo Student',
        email: 'demo@student.com',
        password: 'demo123',
        role: 'user' as const,
      },
      {
        id: 'demo-admin-1',
        name: 'Demo Admin',
        email: 'admin@appsc.com',
        password: 'admin123',
        role: 'admin' as const,
      },
    ]
    localStorage.setItem(demoUsersKey, JSON.stringify(seeded))
    return seeded
  }

  try {
    return JSON.parse(raw) as Array<{ id: string; name: string; email: string; password: string; role: 'user' | 'admin' }>
  } catch {
    return []
  }
}

export const setDemoUsers = (users: Array<{ id: string; name: string; email: string; password: string; role: 'user' | 'admin' }>) => {
  localStorage.setItem(demoUsersKey, JSON.stringify(users))
}

export const getDemoUser = (email: string) => {
  return getDemoUsers().find((user) => user.email.toLowerCase() === email.toLowerCase())
}

export const getUserDashboard = (user: AppUser): DashboardState => {
  const raw = localStorage.getItem(`${demoSessionKey}:${user.id}`)

  if (!raw) {
    const seeded: DashboardState = {
      ...defaultDashboard,
      appName: `${user.name.split(' ')[0] || 'User'}_TRACK`,
      sessionName: `${user.name.split(' ')[0] || 'Student'}'s Session`,
      status: 'demo',
    }
    localStorage.setItem(`${demoSessionKey}:${user.id}`, JSON.stringify(seeded))
    return seeded
  }

  try {
    return JSON.parse(raw) as DashboardState
  } catch {
    return defaultDashboard
  }
}

export const saveUserDashboard = (user: AppUser, dashboard: DashboardState) => {
  localStorage.setItem(`${demoSessionKey}:${user.id}`, JSON.stringify(dashboard))
}
