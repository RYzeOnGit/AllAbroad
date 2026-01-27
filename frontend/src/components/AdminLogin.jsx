import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import './AdminLogin.css'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.detail || 'Login failed')
        setLoading(false)
        return
      }

      const data = await response.json()
      login(data.access_token, data.role)
      navigate('/admin/dashboard')
    } catch (err) {
      setError('Network error. Check backend is running.')
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Staff Login</h1>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit}>
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

        <div className="auth-link-row">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="auth-link">
            Sign up here
          </Link>
        </div>
      </div>
    </div>
  )
}
