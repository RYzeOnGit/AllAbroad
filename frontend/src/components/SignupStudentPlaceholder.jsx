import React from 'react'
import { Link } from 'react-router-dom'
import './SignupForm.css'

export default function SignupStudentPlaceholder() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Sign up as student</h1>
        <p style={{ color: '#555', marginBottom: '1.25rem', lineHeight: 1.5, fontSize: 'clamp(0.9rem, 1vw + 0.5rem, 1rem)' }}>
          Student sign-up is coming soon. Use Apply to submit your application.
        </p>
        <Link to="/apply" className="auth-submit" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
          Go to Apply
        </Link>
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
