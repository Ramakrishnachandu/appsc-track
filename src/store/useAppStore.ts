import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { getDemoUser, getDemoUsers, getUserDashboard, saveUserDashboard, setDemoUsers } from '../lib/demoData'
import { getExamCountdown } from '../data/dashboardData'
import type { AppUser, DashboardState } from '../types/auth'

type AuthMode = 'login' | 'register'

const defaultDashboard: DashboardState = {
  appName: 'APPSC_TRACK',
  sessionName: 'Demo Session',
  status: 'demo',
  overallProgress: 42,
  studyStreak: 12,
  mcqAccuracy: 76,
  dailyHours: 4.2,
  examCountdown: getExamCountdown(),
}

type AppState = {
  user: AppUser | null
  authMode: AuthMode
  dashboard: DashboardState
  loading: boolean
  error: string | null
  setAuthMode: (mode: AuthMode) => void
  hydrateSession: () => Promise<void>
  login: (payload: { email: string; password: string }) => Promise<void>
  register: (payload: { name: string; email: string; password: string }) => Promise<void>
  logout: () => Promise<void>
  updateDashboard: (next: DashboardState) => void
}

const toUser = (name: string, email: string, id: string): AppUser => ({ id, name, email })

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  authMode: 'login',
  dashboard: defaultDashboard,
  loading: false,
  error: null,
  setAuthMode: (mode) => set({ authMode: mode, error: null }),

  hydrateSession: async () => {
    if (!supabase) {
      const stored = localStorage.getItem('appsc_active_user')
      if (!stored) {
        set({ user: null, dashboard: defaultDashboard })
        return
      }

      try {
        const signedInUser = JSON.parse(stored) as AppUser
        set({ user: signedInUser, dashboard: getUserDashboard(signedInUser) })
      } catch {
        set({ user: null, dashboard: defaultDashboard })
      }
      return
    }

    const { data, error } = await supabase.auth.getSession()
    if (error || !data.session?.user) {
      set({ user: null, dashboard: defaultDashboard })
      return
    }

    const activeUser = toUser(
      data.session.user.user_metadata?.full_name || data.session.user.email?.split('@')[0] || 'Student',
      data.session.user.email || '',
      data.session.user.id,
    )

    set({ user: activeUser, dashboard: defaultDashboard })
  },

  login: async ({ email, password }) => {
    set({ loading: true, error: null })

    try {
      if (!supabase) {
        const existing = getDemoUser(email)
        if (!existing || existing.password !== password) {
          throw new Error('Invalid email or password.')
        }

        const user = toUser(existing.name, existing.email, existing.id)
        const dashboard = getUserDashboard(user)
        localStorage.setItem('appsc_active_user', JSON.stringify(user))
        set({ user, dashboard, loading: false, error: null })
        return
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

      const user = toUser(
        data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'Student',
        data.user.email || '',
        data.user.id,
      )

      set({ user, loading: false, error: null, dashboard: defaultDashboard })
      return
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Authentication failed.'
      set({ loading: false, error: message })
      throw err
    }
  },

  register: async ({ name, email, password }) => {
    set({ loading: true, error: null })

    try {
      if (!supabase) {
        const users = getDemoUsers()
        const exists = users.some((user) => user.email.toLowerCase() === email.toLowerCase())
        if (exists) {
          throw new Error('User already exists. Please log in instead.')
        }

        const newUser = { id: `demo-${Date.now()}`, name, email, password }
        users.push(newUser)
        setDemoUsers(users)
        const user = toUser(name, email, newUser.id)
        localStorage.setItem('appsc_active_user', JSON.stringify(user))
        const dashboard = getUserDashboard(user)
        set({ user, dashboard, loading: false, error: null })
        return
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      })

      if (error) throw error

      const user = toUser(
        name || data.user?.email?.split('@')[0] || 'Student',
        data.user?.email || email,
        data.user?.id || crypto.randomUUID(),
      )

      set({ user, loading: false, error: null, dashboard: defaultDashboard })
      return
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed.'
      set({ loading: false, error: message })
      throw err
    }
  },

  logout: async () => {
    if (supabase) {
      await supabase.auth.signOut()
    }

    localStorage.removeItem('appsc_active_user')
    set({ user: null, dashboard: defaultDashboard, error: null })
  },

  updateDashboard: (next) => {
    const currentUser = get().user
    if (currentUser && !supabase) {
      saveUserDashboard(currentUser, next)
    }
    set({ dashboard: next })
  },
}))
