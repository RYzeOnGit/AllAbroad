import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/Header'
import Hero from './components/Hero'
import About from './components/About'
import LeadForm from './components/LeadForm'
import Footer from './components/Footer'
import AdminLogin from './components/AdminLogin'
import AdminDashboard, { AdminLeadsPage, AdminKanbanPage, AdminStatsPage } from './components/AdminDashboard'
import NoAccess from './components/NoAccess'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './auth/AuthContext'
import './App.css'

function PublicLayout() {
  return (
    <div className="App">
      <Header />
      <Hero />
      <About />
      <LeadForm />
      <Footer />
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PublicLayout />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin/dashboard"
            element={(
              <ProtectedRoute allowRoles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            )}
          >
            <Route index element={<AdminLeadsPage />} />
            <Route path="kanban" element={<AdminKanbanPage />} />
            <Route path="stats" element={<AdminStatsPage />} />
          </Route>
          <Route path="/admin/no-access" element={<NoAccess />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App

