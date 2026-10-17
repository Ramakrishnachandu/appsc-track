import { Button } from '@mui/material'

type PageHeaderProps = {
  title: string
  userName: string
  onLogout: () => void
}

export function PageHeader({ title, userName, onLogout }: PageHeaderProps) {
  return (
    <header className="page-outlet-header">
      <div>
        <h2>{title}</h2>
      </div>

      <div className="header-user">
        <span>{userName}</span>
        <Button variant="outlined" size="small" onClick={onLogout}>
          Logout
        </Button>
      </div>
    </header>
  )
}
