import React, { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

function safeGetItem(key) {
  try { return localStorage.getItem(key) || null } catch { return null }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => safeGetItem('token'))
  const [role, setRole] = useState(() => safeGetItem('role'))

  const login = (accessToken, userRole) => {
    setToken(accessToken)
    setRole(userRole)
    localStorage.setItem('token', accessToken)
    localStorage.setItem('role', userRole)
  }

  const logout = () => {
    setToken(null)
    setRole(null)
    localStorage.removeItem('token')
    localStorage.removeItem('role')
  }

  return <AuthContext.Provider value={{ token, role, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
