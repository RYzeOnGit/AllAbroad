import React, { createContext, useContext, useMemo, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null)
  const [role, setRole] = useState(null)

  const login = (nextToken, nextRole) => {
    setToken(nextToken)
    setRole(nextRole)
  }

  const logout = () => {
    setToken(null)
    setRole(null)
  }

  const value = useMemo(() => ({ token, role, login, logout }), [token, role])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
