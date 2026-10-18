import { HelpOutlined, MenuOutlined } from '@mui/icons-material'
import { Button, IconButton } from '@mui/material'

type PageHeaderProps = {
  title: string
  userName: string
  onLogout: () => void
  onOpenTour: () => void
  onOpenMobileNav: () => void
}

export function PageHeader({ title, userName, onLogout, onOpenTour, onOpenMobileNav }: PageHeaderProps) {
  return (
    <header className="page-outlet-header">
      <IconButton className="mobile-nav-trigger" aria-label="Open navigation" onClick={onOpenMobileNav}>
        <MenuOutlined />
      </IconButton>
      <div>
        <h2>{title}</h2>
      </div>

      <div className="header-user">
        <span>{userName}</span>
        <Button variant="text" size="small" startIcon={<HelpOutlined />} onClick={onOpenTour}>
          App tour
        </Button>
        <Button variant="outlined" size="small" onClick={onLogout}>
          Logout
        </Button>
      </div>
    </header>
  )
}
