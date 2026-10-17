import { AdminPanelSettingsOutlined, AutoStoriesOutlined, BarChartOutlined, CalendarMonthOutlined, ChevronLeftOutlined, ChevronRightOutlined, DashboardOutlined, ExitToAppOutlined, NoteAltOutlined, QuizOutlined, SchoolOutlined, SettingsOutlined, TimelineOutlined } from '@mui/icons-material'
import { Button } from '@mui/material'
import { NavLink } from 'react-router-dom'

export type NavItem = {
  label: string
  path: string
  icon: React.ReactNode
}

type AppSidebarProps = {
  user: {
    name?: string | null
    email?: string | null
    role?: 'user' | 'admin'
  }
  sidebarCollapsed: boolean
  onToggleSidebar: () => void
  visibleNavItems: NavItem[]
  onLogout: () => void
}

const navItemConfig: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: <DashboardOutlined fontSize="small" /> },
  { label: 'Study Plan', path: '/study-plan', icon: <CalendarMonthOutlined fontSize="small" /> },
  { label: 'Subjects', path: '/subjects', icon: <SchoolOutlined fontSize="small" /> },
  { label: 'Practice', path: '/practice', icon: <TimelineOutlined fontSize="small" /> },
  { label: 'Mock Tests', path: '/mock-tests', icon: <QuizOutlined fontSize="small" /> },
  { label: 'Revision', path: '/revision', icon: <AutoStoriesOutlined fontSize="small" /> },
  { label: 'Analytics', path: '/analytics', icon: <BarChartOutlined fontSize="small" /> },
  { label: 'Notes', path: '/notes', icon: <NoteAltOutlined fontSize="small" /> },
  { label: 'Settings', path: '/settings', icon: <SettingsOutlined fontSize="small" /> },
  { label: 'Admin', path: '/admin/content', icon: <AdminPanelSettingsOutlined fontSize="small" /> },
]

export const getNavItems = (role?: 'user' | 'admin') =>
  navItemConfig.filter((item) => item.label !== 'Admin' || role === 'admin')

export function AppSidebar({ user, sidebarCollapsed, onToggleSidebar, visibleNavItems, onLogout }: AppSidebarProps) {
  return (
    <aside className={sidebarCollapsed ? 'sidebar sidebar-collapsed' : 'sidebar'}>
      <div className="sidebar-inner">
        <div className="sidebar-header-row">
          <div className="brand">APPSC</div>
          <button type="button" className="sidebar-toggle" onClick={onToggleSidebar}>
            {sidebarCollapsed ? <ChevronRightOutlined fontSize="small" /> : <ChevronLeftOutlined fontSize="small" />}
          </button>
        </div>

        <div className="user-profile-card">
          <div className="user-avatar">{(user.name || user.email || 'S').slice(0, 1).toUpperCase()}</div>
          {!sidebarCollapsed && (
            <div className="user-meta">
              <span className="user-name">{user.name || 'Student'}</span>
              <span className="user-email">{user.email}</span>
            </div>
          )}
        </div>

        <nav className="nav-list">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.path}
              className={({ isActive }) => (isActive ? `nav-item active${sidebarCollapsed ? ' collapsed' : ''}` : `nav-item${sidebarCollapsed ? ' collapsed' : ''}`)}
            >
              <span className="nav-item-icon">{item.icon}</span>
              {!sidebarCollapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <Button type="button" className="logout-button" onClick={onLogout}>
            <ExitToAppOutlined fontSize="small" />
            {!sidebarCollapsed && <span>Logout</span>}
          </Button>
        </div>
      </div>
    </aside>
  )
}
