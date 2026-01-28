import React from 'react'
import { Link } from 'react-router-dom'

export default function StudentDashboard() {
  return (
    <div style={{ padding: '2rem', maxWidth: 560, margin: '0 auto' }}>
      <h1 style={{ marginBottom: '0.5rem' }}>Student dashboard</h1>
      <p style={{ color: '#555', marginBottom: '1.5rem' }}>
        Full dashboard coming soon.
      </p>
      <Link to="/apply" style={{ color: '#667eea', fontWeight: 600 }}>
        Go to Apply
      </Link>
      {' · '}
      <Link to="/" style={{ color: '#667eea', fontWeight: 600 }}>
        Back to home
      </Link>
    </div>
  )
}
