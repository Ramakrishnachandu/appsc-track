import { useState } from 'react'
import { Button, Card, CardContent, IconButton, InputAdornment, TextField, Typography } from '@mui/material'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import appscLogo from '../assets/appsc-logo.svg'

type AuthShellProps = {
  authMode: 'login' | 'register'
  name: string
  email: string
  password: string
  loading: boolean
  error: string | null
  onAuthModeChange: (mode: 'login' | 'register') => void
  onNameChange: (value: string) => void
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onSubmit: () => void
}

export function AuthShell({
  authMode,
  name,
  email,
  password,
  loading,
  error,
  onAuthModeChange,
  onNameChange,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}: AuthShellProps) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="auth-shell">
      <div className="auth-panel">
        <div className="auth-visual">
          <div className="brand-badge">
            <img src={appscLogo} alt="APPSC logo" className="appsc-logo" />
          </div>

          <Typography variant="overline" className="auth-kicker">APPSC TRACK</Typography>
          <h2 className="visual-title">Your preparation dashboard for APPSC success.</h2>
          <p className="visual-subtitle">
            Study plans, syllabus mapping, mock test practice, revision notes, and exam analytics in one place.
          </p>

          <ul className="feature-list">
            <li>Smart syllabus coverage</li>
            <li>Daily study routines</li>
            <li>Progress analytics</li>
            <li>Mock test tracking</li>
          </ul>
        </div>

        <Card className="auth-card">
          <CardContent className="auth-card-content">
            <div className="auth-header-row">
              <h3 className="auth-title">{authMode === 'login' ? 'Welcome back' : 'Create account'}</h3>
              <span className="status-pill">{authMode === 'login' ? 'Login' : 'Register'}</span>
            </div>

            <p className="auth-subtitle">
              {authMode === 'login'
                ? 'Sign in to continue with your APPSC study plan.'
                : 'Create your account and start tracking your preparation journey.'}
            </p>

            <div className="auth-form">
              {authMode === 'register' && (
                <TextField
                  label="Full name"
                  value={name}
                  onChange={(event) => onNameChange(event.target.value)}
                  fullWidth
                  margin="normal"
                />
              )}

              <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(event) => onEmailChange(event.target.value)}
                fullWidth
                margin="normal"
              />

              <TextField
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => onPasswordChange(event.target.value)}
                fullWidth
                margin="normal"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        edge="end"
                        onClick={() => setShowPassword((value) => !value)}
                        onMouseDown={(event) => event.preventDefault()}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {error && (
                <Typography color="error" variant="body2" className="auth-error">
                  {error}
                </Typography>
              )}

              <Button variant="contained" fullWidth onClick={onSubmit} disabled={loading} sx={{ mt: 1 }}>
                {loading ? 'Please wait...' : authMode === 'register' ? 'Create account' : 'Login'}
              </Button>

              <Button
                variant="text"
                className="switch-auth-btn"
                onClick={() => {
                  setShowPassword(false)
                  onAuthModeChange(authMode === 'login' ? 'register' : 'login')
                }}
              >
                {authMode === 'login' ? 'Need an account? Register' : 'Already have an account? Login'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
