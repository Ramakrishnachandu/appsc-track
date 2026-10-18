import { useEffect, useState } from 'react'
import { Box, Button, Card, CardContent, CircularProgress, Typography, useMediaQuery } from '@mui/material'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { AppSidebar, getNavItems } from './components/AppSidebar'
import { AppTour } from './components/AppTour'
import { AuthShell } from './components/AuthShell'
import { PageHeader } from './components/PageHeader'
import {
  AdminPage,
  AnalyticsPage,
  DashboardPage,
  MockTestsPage,
  NotesPage,
  PracticePage,
  RevisionPage,
  SettingsPage,
  StudyPlanPage,
  SubjectsPage,
} from './pages'
import './App.css'
import { useAppStore } from './store/useAppStore'
import { useStudyPlanStore } from './store/useStudyPlanStore'

function NotFoundState() {
  const navigate = useNavigate()

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      navigate('/login', { replace: true })
    }, 1400)

    return () => window.clearTimeout(timeout)
  }, [navigate])

  return (
    <div className="not-found-shell">
      <Card className="not-found-card">
        <CardContent className="not-found-card-content">
          <Typography variant="h3" className="not-found-title">404</Typography>
          <Typography variant="h5" className="not-found-heading">Page not found</Typography>
          <Typography variant="body1" className="not-found-copy">
            The page you are looking for does not exist or has been moved.
          </Typography>
          <Button variant="contained" onClick={() => navigate('/login', { replace: true })}>
            Go to login
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function App() {
  const { user, authMode, loading, sessionHydrated, error, setAuthMode, login, register, logout, hydrateSession } = useAppStore()
  const loadStudyPlan = useStudyPlanStore((state) => state.loadForUser)
  const resetStudyPlan = useStudyPlanStore((state) => state.reset)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [tourOpen, setTourOpen] = useState(false)
  const isMobile = useMediaQuery('(max-width: 980px)')
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    void hydrateSession()
  }, [hydrateSession])

  useEffect(() => {
    if (!sessionHydrated) return
    if (user) {
      void loadStudyPlan(user.id)
    } else {
      resetStudyPlan()
    }
  }, [loadStudyPlan, resetStudyPlan, sessionHydrated, user])

  useEffect(() => {
    if (!isMobile || !mobileNavOpen) return

    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileNavOpen(false)
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [isMobile, mobileNavOpen])

  useEffect(() => {
    const breakpoint = window.matchMedia('(max-width: 980px)')
    const closeDrawerOnResize = () => setMobileNavOpen(false)
    breakpoint.addEventListener('change', closeDrawerOnResize)
    return () => breakpoint.removeEventListener('change', closeDrawerOnResize)
  }, [])

  useEffect(() => {
    if (!sessionHydrated) return

    if (!user) {
      return
    }

    if (location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/') {
      navigate('/dashboard', { replace: true })
    }
  }, [location.pathname, navigate, sessionHydrated, user])

  const handleAuthModeChange = (nextMode: 'login' | 'register') => {
    setAuthMode(nextMode)
    navigate(nextMode === 'login' ? '/login' : '/register', { replace: false })
  }

  const completeTour = () => {
    if (user) {
      window.localStorage.setItem(`appsc_tour_completed:${user.id}`, 'true')
    }
    setTourOpen(false)
  }

  const visitTourFeature = (path: string) => {
    completeTour()
    setMobileNavOpen(false)
    navigate(path)
  }

  const handleLogout = () => {
    setTourOpen(false)
    setMobileNavOpen(false)
    void logout()
  }

  const handleSubmit = async () => {
    try {
      if (authMode === 'register') {
        await register({ name, email, password })
        setAuthMode('login')
        setPassword('')
        navigate('/login', { replace: true })
      } else {
        await login({ email, password })
      }
    } catch {
      // handled by store error state
    }
  }

  const pageTitle = (() => {
    if (location.pathname.startsWith('/admin')) return 'Admin'
    if (location.pathname === '/dashboard') return 'Dashboard'
    if (location.pathname === '/study-plan') return 'Study Plan'
    if (location.pathname === '/subjects') return 'Subjects'
    if (location.pathname === '/practice') return 'Practice'
    if (location.pathname === '/mock-tests') return 'Mock Tests'
    if (location.pathname === '/revision') return 'Revision'
    if (location.pathname === '/analytics') return 'Analytics'
    if (location.pathname === '/notes') return 'Notes'
    if (location.pathname === '/settings') return 'Settings'
    return 'Dashboard'
  })()

  if (!sessionHydrated) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress aria-label="Restoring session" />
      </Box>
    )
  }

  if (!user) {
    return (
      <Routes>
        <Route
          path="/login"
          element={
            <AuthShell
              authMode="login"
              name={name}
              email={email}
              password={password}
              loading={loading}
              error={error}
              onAuthModeChange={handleAuthModeChange}
              onNameChange={setName}
              onEmailChange={setEmail}
              onPasswordChange={setPassword}
              onSubmit={() => void handleSubmit()}
            />
          }
        />
        <Route
          path="/register"
          element={
            <AuthShell
              authMode="register"
              name={name}
              email={email}
              password={password}
              loading={loading}
              error={error}
              onAuthModeChange={handleAuthModeChange}
              onNameChange={setName}
              onEmailChange={setEmail}
              onPasswordChange={setPassword}
              onSubmit={() => void handleSubmit()}
            />
          }
        />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/dashboard" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  const visibleNavItems = getNavItems(user.role)
  const shouldShowTour = sessionHydrated
    && (tourOpen || window.localStorage.getItem(`appsc_tour_completed:${user.id}`) !== 'true')

  return (
    <Box className={!isMobile && sidebarCollapsed ? 'app-layout sidebar-collapsed' : 'app-layout'}>
      <AppSidebar
        user={user}
        sidebarCollapsed={!isMobile && sidebarCollapsed}
        isMobile={isMobile}
        mobileOpen={mobileNavOpen}
        onToggleSidebar={() => setSidebarCollapsed((value) => !value)}
        onCloseMobile={() => setMobileNavOpen(false)}
        visibleNavItems={visibleNavItems}
        onLogout={handleLogout}
      />

      <main className="main-panel">
        <PageHeader
          title={pageTitle}
          userName={user.name || user.email || 'Student'}
          onLogout={handleLogout}
          onOpenTour={() => setTourOpen(true)}
          onOpenMobileNav={() => setMobileNavOpen(true)}
        />

        <div className="page-content">
          <Routes>
            <Route path="/login" element={<Navigate to="/dashboard" replace />} />
            <Route path="/register" element={<Navigate to="/dashboard" replace />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/study-plan" element={<StudyPlanPage />} />
            <Route path="/subjects" element={<SubjectsPage />} />
            <Route path="/practice" element={<PracticePage />} />
            <Route path="/mock-tests" element={<MockTestsPage />} />
            <Route path="/revision" element={<RevisionPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/notes" element={<NotesPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/admin" element={user.role === 'admin' ? <Navigate to="/admin/content" replace /> : <Navigate to="/dashboard" replace />} />
            <Route path="/admin/content" element={user.role === 'admin' ? <AdminPage initialSection="content" /> : <Navigate to="/dashboard" replace />} />
            <Route path="/admin/mock-tests" element={user.role === 'admin' ? <AdminPage initialSection="mock" /> : <Navigate to="/dashboard" replace />} />
            <Route path="/admin/mock" element={user.role === 'admin' ? <Navigate to="/admin/mock-tests" replace /> : <Navigate to="/dashboard" replace />} />
            <Route
              path="/admin/*"
              element={user.role === 'admin' ? <AdminPage /> : <Navigate to="/dashboard" replace />}
            />
            <Route path="*" element={<NotFoundState />} />
          </Routes>
        </div>
      </main>
      <AppTour open={shouldShowTour} onClose={completeTour} onVisit={visitTourFeature} />
    </Box>
  )
}

export default App
