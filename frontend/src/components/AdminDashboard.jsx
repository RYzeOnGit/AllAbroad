import React from 'react'
import { useAuth } from '../auth/AuthContext'

export default function AdminDashboard() {
  const { logout } = useAuth()

  return (
    <div style={{ maxWidth: 720, margin: '48px auto', padding: 24 }}>
      <h2>Admin Dashboard (MVP placeholder)</h2>
      <p>Protected area for staff-only tools.</p>
      <button onClick={logout} style={{ marginTop: 16 }}>Logout</button>
    </div>
  )
}
