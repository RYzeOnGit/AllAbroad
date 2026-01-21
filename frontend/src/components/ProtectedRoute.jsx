import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function ProtectedRoute({ children, allowRoles = ['admin'] }) {
  const { token, role } = useAuth()

  if (!token) {
    return <Navigate to="/admin/login" replace />
  }

  if (!allowRoles.includes(role)) {
    return <Navigate to="/admin/no-access" replace />
  }

  return children
}
