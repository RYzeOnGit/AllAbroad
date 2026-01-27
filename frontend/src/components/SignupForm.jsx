import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

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
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div style={{ background: 'white', padding: 40, borderRadius: 8, boxShadow: '0 10px 25px rgba(0,0,0,0.2)', width: '100%', maxWidth: 400 }}>
        <h1 style={{ textAlign: 'center', marginBottom: 30, color: '#333' }}>Sign Up</h1>
        
        {error && <div style={{ background: '#f8d7da', color: '#721c24', padding: 12, borderRadius: 4, marginBottom: 20, border: '1px solid #f5c6cb' }}>{error}</div>}
        
        {success && <div style={{ background: '#d4edda', color: '#155724', padding: 12, borderRadius: 4, marginBottom: 20, border: '1px solid #c3e6cb' }}>{success}</div>}
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: '#333' }}>Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 4, fontSize: 14, boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: '#333' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 4, fontSize: 14, boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: '#333' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 4, fontSize: 14, boxSizing: 'border-box' }}
            />
            <span style={{ fontSize: '12px', color: '#666' }}>Minimum 8 characters</span>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: '#333' }}>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 4, fontSize: 14, boxSizing: 'border-box' }}
            />
          </div>

          <button type="submit" disabled={loading} style={{ width: '100%', padding: 12, background: loading ? '#999' : '#667eea', color: 'white', border: 'none', borderRadius: 4, fontSize: 16, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Signing up...' : 'Sign Up'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20, color: '#666', fontSize: '14px' }}>
          Already have an account?{' '}
          <Link to="/admin/login" style={{ color: '#667eea', textDecoration: 'none', fontWeight: 600 }}>
            Login here
          </Link>
        </div>
      </div>
    </div>
  )
}
