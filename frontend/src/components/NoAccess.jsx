import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import './NoAccess.css'

export default function NoAccess() {
  const { role } = useAuth()

  if (role === 'lead') {
    return (
      <div className="no-access">
        <h2>No access</h2>
        <p>This area is for staff. Go to your dashboard.</p>
        <p>
          <Link to="/student/dashboard" className="no-access-link">Go to your dashboard</Link>
        </p>
      </div>
    )
  }

  return (
    <div className="no-access">
      <h2>No access</h2>
      <p>If you believe this is a mistake, contact an admin.</p>
    </div>
  )
}
