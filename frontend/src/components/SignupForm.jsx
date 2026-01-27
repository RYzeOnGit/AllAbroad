import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import './SignupForm.css'

export default function SignupForm() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    if (!fullName.trim()) {
      setError('Full name is required')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName, email, password })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.detail || 'Signup failed')
        setLoading(false)
        return
      }

      setSuccess('Signup successful! Awaiting admin approval. You will receive an email once approved.')
      setTimeout(() => navigate('/admin/login'), 3000)
    } catch (err) {
      setError('Network error. Check backend is running.')
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Sign Up</h1>

        {error && <div className="auth-error">{error}</div>}

        {success && <div className="auth-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="auth-form-group">
            <label className="auth-label" htmlFor="signup-fullname">Full Name</label>
            <input
              id="signup-fullname"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="auth-input"
            />
          </div>

          <div className="auth-form-group">
            <label className="auth-label" htmlFor="signup-email">Email</label>
            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="auth-input"
            />
          </div>

          <div className="auth-form-group">
            <label className="auth-label" htmlFor="signup-password">Password</label>
            <input
              id="signup-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="auth-input"
            />
            <span className="auth-hint">Minimum 8 characters</span>
          </div>

          <div className="auth-form-group">
            <label className="auth-label" htmlFor="signup-confirm">Confirm Password</label>
            <input
              id="signup-confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className="auth-input"
            />
          </div>

          <button type="submit" disabled={loading} className="auth-submit">
            {loading ? 'Signing up...' : 'Sign Up'}
          </button>
        </form>

        <div className="auth-link-row">
          Already have an account?{' '}
          <Link to="/admin/login" className="auth-link">
            Login here
          </Link>
        </div>
      </div>
    </div>
  )
}
