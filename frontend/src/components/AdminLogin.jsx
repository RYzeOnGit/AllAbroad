import React, { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import './AdminLogin.css'

export default function AdminLogin() {
  const [mode, setMode] = useState('staff') // 'staff' | 'student'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login } = useAuth()

  useEffect(() => {
    const e = searchParams.get('error')
    if (e === 'deactivated') setError('Your account has been deactivated.')
    else if (e === 'invalid_credentials') setError('Invalid username or password')
  }, [searchParams])

  const handleModeChange = (m) => {
    setMode(m)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    console.log('Login attempt:', { mode, email: email.substring(0, 10) + '...', passwordLength: password.length })

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      console.log('Response status:', response.status, response.statusText)

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        console.error('Login error:', response.status, data)
        setError(data.detail || `Login failed (${response.status})`)
        setLoading(false)
        return
      }

      const data = await response.json()
      console.log('Login success:', data.role)
      login(data.access_token, data.role)
      if (data.role === 'lead') {
        navigate('/student/dashboard')
        return
      }
      navigate('/admin/dashboard')
    } catch (err) {
      console.error('Login exception:', err)
      if (err.name === 'AbortError') {
        setError('Request timed out. The server may be busy. Please try again.')
      } else {
        setError(err.message || 'Network error. Check backend is running.')
      }
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-page-orbs" aria-hidden>
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-orb auth-orb-3" />
      </div>
      <div className="auth-card">
        <h1 className="auth-title">Sign in</h1>

        <div className="auth-mode-toggle" data-active={mode}>
          <button
            type="button"
            className={`auth-tab ${mode === 'staff' ? 'active' : ''}`}
            onClick={() => handleModeChange('staff')}
          >
            Sign in as staff
          </button>
          <button
            type="button"
            className={`auth-tab ${mode === 'student' ? 'active' : ''}`}
            onClick={() => handleModeChange('student')}
          >
            Sign in as student
          </button>
        </div>

        {error && <div className="auth-error">{error}</div>}

        {mode === 'staff' ? (
          <form onSubmit={handleSubmit} className="auth-form-block">
            <div className="auth-form-group">
              <label className="auth-label" htmlFor="login-email">Email</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="auth-input"
              />
            </div>
            <div className="auth-form-group">
              <label className="auth-label" htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="auth-input"
              />
            </div>
            <button type="submit" disabled={loading} className="auth-submit">
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form-block">
            <div className="auth-form-group">
              <label className="auth-label" htmlFor="student-email">Email</label>
              <input
                id="student-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="auth-input"
              />
            </div>
            <div className="auth-form-group">
              <label className="auth-label" htmlFor="student-password">Password</label>
              <input
                id="student-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="auth-input"
              />
          </div>
            <button type="submit" disabled={loading} className="auth-submit">
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        )}

        <div className="auth-link-row">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="auth-link">Sign up as staff</Link>
          {' · '}
          <Link to="/signup/student" className="auth-link">Sign up as student</Link>
        </div>
      </div>
    </div>
  )
}
