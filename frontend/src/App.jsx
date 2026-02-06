import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Header from './components/Header'
import Hero from './components/Hero'
import DestinationsSection from './components/DestinationsSection'
import WhyUs from './components/WhyUs'
import StudentStories from './components/StudentStories'
import CtaBlock from './components/CtaBlock'
import Footer from './components/Footer'
import ApplyPage from './components/ApplyPage'
import AdminLogin from './components/AdminLogin'
import SignupForm from './components/SignupForm'
import SignupStudentPlaceholder from './components/SignupStudentPlaceholder'
import AdminDashboard, { AdminLeadsPage, AdminKanbanPage, AdminStatsPage, AdminProfilePage, AdminApprovalsPage, AdminUsersPage, AdminMessagesPage } from './components/AdminDashboard'
import NoAccess from './components/NoAccess'
import ProtectedRoute from './components/ProtectedRoute'
import StudentDashboard from './components/StudentDashboard'
import { AuthProvider } from './auth/AuthContext'
import { ContentProvider } from './context/ContentContext'
import './App.css'

class ErrorBoundary extends React.Component {
  state = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  componentDidCatch(err, info) { console.error('ErrorBoundary:', err, info) }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
          <h1>Something went wrong</h1>
          <p>Check the browser console for details.</p>
        </div>
      )
    }
    return this.props.children
  }
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function PublicLayout() {
  return (
    <div className="App">
      <Header />
      <Hero />
      <DestinationsSection />
      <WhyUs />
      <StudentStories />
      <CtaBlock />
      <Footer />
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <ContentProvider>
            <ScrollToTop />
            <Routes>
            <Route path="/" element={<PublicLayout />} />
          <Route path="/apply" element={<ApplyPage />} />
          <Route path="/signup" element={<SignupForm />} />
          <Route path="/signup/student" element={<SignupStudentPlaceholder />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin/dashboard"
            element={(
              <ProtectedRoute allowRoles={["admin", "user"]}>
                <AdminDashboard />
              </ProtectedRoute>
            )}
          >
            <Route index element={<AdminLeadsPage />} />
            <Route path="kanban" element={<AdminKanbanPage />} />
            <Route path="stats" element={<AdminStatsPage />} />
            <Route path="profile" element={<AdminProfilePage />} />
            <Route path="approvals" element={<AdminApprovalsPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="messages" element={<AdminMessagesPage />} />
          </Route>
          <Route path="/admin/no-access" element={<NoAccess />} />
          <Route
            path="/student/dashboard/*"
            element={(
              <ProtectedRoute allowRoles={['lead']}>
                <StudentDashboard />
              </ProtectedRoute>
            )}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ContentProvider>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App

