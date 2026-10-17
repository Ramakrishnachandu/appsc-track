import { useEffect, useState } from 'react'
import { Box } from '@mui/material'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { AppSidebar, getNavItems } from './components/AppSidebar'
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

function App() {
  const { user, authMode, loading, error, setAuthMode, login, register, logout, hydrateSession } = useAppStore()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    void hydrateSession()
  }, [hydrateSession])

  useEffect(() => {
    if (user && location.pathname === '/') {
      navigate('/dashboard', { replace: true })
    }
  }, [location.pathname, navigate, user])

  const handleSubmit = async () => {
    try {
      if (authMode === 'register') {
        await register({ name, email, password })
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

  if (!user) {
    return (
      <AuthShell
        authMode={authMode}
        name={name}
        email={email}
        password={password}
        loading={loading}
        error={error}
        onAuthModeChange={setAuthMode}
        onNameChange={setName}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onSubmit={() => void handleSubmit()}
      />
    )
  }

  const visibleNavItems = getNavItems(user.role)

  return (
    <Box className={sidebarCollapsed ? 'app-layout sidebar-collapsed' : 'app-layout'}>
      <AppSidebar
        user={user}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed((value) => !value)}
        visibleNavItems={visibleNavItems}
        onLogout={() => void logout()}
      />

      <main className="main-panel">
        <PageHeader title={pageTitle} userName={user.name || user.email || 'Student'} onLogout={() => void logout()} />

        <div className="page-content">
          <Routes>
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
            <Route
              path="/admin/*"
              element={user.role === 'admin' ? <AdminPage /> : <Navigate to="/dashboard" replace />}
            />
            <Route path="/admin/content" element={user.role === 'admin' ? <AdminPage initialSection="content" /> : <Navigate to="/dashboard" replace />} />
            <Route path="/admin/mock" element={user.role === 'admin' ? <AdminPage initialSection="mock" /> : <Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </main>
    </Box>
  )
}

export default App
