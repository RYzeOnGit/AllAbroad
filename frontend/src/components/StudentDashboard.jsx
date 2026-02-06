import React, { useState, useEffect } from 'react'
import { Routes, Route, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import './StudentDashboard.css'

const API_BASE = '/api'

// Dashboard Overview Component
function DashboardOverview() {
  const { token } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {}

  useEffect(() => {
    fetchDashboard()
  }, [token])

  const fetchDashboard = async () => {
    try {
      const res = await fetch(`${API_BASE}/student/dashboard`, {
        headers: { ...authHeaders },
      })
      if (!res.ok) throw new Error('Failed to load dashboard')
      const data = await res.json()
      setStats(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="student-loading">Loading dashboard...</div>
  if (error) return <div className="student-error">Error: {error}</div>
  if (!stats) return null

  return (
    <div className="student-dashboard">
      <header className="student-header">
        <h1>My Dashboard</h1>
        <p>Track your study abroad journey progress</p>
      </header>

      {/* Progress Cards */}
      <div className="progress-grid">
        <div className="progress-card">
          <div className="progress-header">
            <h3>Documents</h3>
            <span className="progress-badge">{stats.documents_progress.completed}/{stats.documents_progress.total}</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${stats.documents_progress.percentage}%` }}
            />
          </div>
          <p className="progress-text">{stats.documents_progress.percentage}% complete</p>
        </div>

        <div className="progress-card">
          <div className="progress-header">
            <h3>Applications</h3>
            <span className="progress-badge">{stats.applications_progress.completed}/{stats.applications_progress.total}</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${stats.applications_progress.percentage}%` }}
            />
          </div>
          <p className="progress-text">{stats.applications_progress.percentage}% complete</p>
        </div>

        <div className="progress-card">
          <div className="progress-header">
            <h3>Visa Status</h3>
            <span className={`status-badge status-${stats.visa_status || 'not_started'}`}>
              {stats.visa_status || 'Not Started'}
            </span>
          </div>
          {stats.visa_stage && <p className="progress-text">Stage: {stats.visa_stage}</p>}
        </div>

        <div className="progress-card">
          <div className="progress-header">
            <h3>Payments</h3>
            {stats.overdue_payments > 0 && (
              <span className="alert-badge">{stats.overdue_payments} overdue</span>
            )}
          </div>
          <p className="progress-text">
            {stats.pending_payments} pending • {stats.overdue_payments} overdue
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="quick-stats">
        <div className="stat-card">
          <div className="stat-icon">📬</div>
          <div className="stat-content">
            <h4>{stats.unread_messages}</h4>
            <p>Unread Messages</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <h4>{stats.upcoming_deadlines.length}</h4>
            <p>Upcoming Deadlines</p>
          </div>
        </div>
      </div>

      {/* Upcoming Deadlines */}
      {stats.upcoming_deadlines.length > 0 && (
        <div className="deadlines-section">
          <h2>Upcoming Deadlines</h2>
          <div className="deadlines-list">
            {stats.upcoming_deadlines.map((deadline, idx) => (
              <div key={idx} className="deadline-item">
                <div className="deadline-date">
                  {new Date(deadline.date).toLocaleDateString()}
                </div>
                <div className="deadline-content">
                  <h4>{deadline.title}</h4>
                  <span className="deadline-type">{deadline.type}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {stats.recent_activity.length > 0 && (
        <div className="activity-section">
          <h2>Recent Activity</h2>
          <div className="activity-list">
            {stats.recent_activity.map((activity) => (
              <div key={activity.id} className="activity-item">
                <div className="activity-icon">{getActivityIcon(activity.event_type)}</div>
                <div className="activity-content">
                  <h4>{activity.title}</h4>
                  <p>{activity.description}</p>
                  <span className="activity-time">
                    {new Date(activity.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function getActivityIcon(eventType) {
  const icons = {
    document_upload: '📄',
    application_submit: '📝',
    payment: '💳',
    visa_update: '✈️',
    message: '💬',
  }
  return icons[eventType] || '📌'
}

// Document Center
function DocumentsPage() {
  const { token } = useAuth()
  const [documents, setDocuments] = useState([])
  const [checklist, setChecklist] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedType, setSelectedType] = useState('')
  const [file, setFile] = useState(null)
  const [replacingDoc, setReplacingDoc] = useState(null)

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {}

  useEffect(() => {
    fetchDocuments()
    fetchChecklist()
  }, [token])

  useEffect(() => {
    // Check if selected type already has a document
    if (selectedType) {
      const existing = documents.find(d => d.document_type === selectedType)
      setReplacingDoc(existing)
    } else {
      setReplacingDoc(null)
    }
  }, [selectedType, documents])

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`${API_BASE}/student/documents`, {
        headers: { ...authHeaders },
      })
      if (!res.ok) throw new Error('Failed to load documents')
      const data = await res.json()
      setDocuments(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchChecklist = async () => {
    try {
      const res = await fetch(`${API_BASE}/student/documents/checklist`, {
        headers: { ...authHeaders },
      })
      if (res.ok) {
        const data = await res.json()
        setChecklist(data.checklist || [])
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file || !selectedType) return

    // Validate PDF
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('Only PDF files are allowed')
      return
    }

    // Validate file size (10MB max)
    const MAX_FILE_SIZE_MB = 10
    const fileSizeMB = file.size / (1024 * 1024)
    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      alert(`File size (${fileSizeMB.toFixed(2)}MB) exceeds maximum allowed size of ${MAX_FILE_SIZE_MB}MB`)
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('document_type', selectedType)

    try {
      const res = await fetch(`${API_BASE}/student/documents`, {
        method: 'POST',
        headers: { ...authHeaders },
        body: formData,
      })
      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.detail || 'Upload failed')
      }
      await fetchDocuments()
      await fetchChecklist()
      setFile(null)
      setSelectedType('')
      setReplacingDoc(null)
      e.target.reset()
    } catch (err) {
      alert('Upload failed: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return
    try {
      const res = await fetch(`${API_BASE}/student/documents/${docId}`, {
        method: 'DELETE',
        headers: { ...authHeaders },
      })
      if (!res.ok) throw new Error('Delete failed')
      await fetchDocuments()
      await fetchChecklist()
    } catch (err) {
      alert('Delete failed: ' + err.message)
    }
  }

  const handleDownload = async (doc) => {
    try {
      const res = await fetch(`${API_BASE}/student/documents/${doc.id}/download`, {
        headers: { ...authHeaders },
      })
      if (!res.ok) {
        throw new Error('Failed to download document')
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      // Open PDF in new tab for viewing
      window.open(url, '_blank')
      // Clean up the URL after a delay to allow the browser to load it
      setTimeout(() => window.URL.revokeObjectURL(url), 100)
    } catch (err) {
      alert('Failed to open document: ' + err.message)
    }
  }

  const handleReplace = async (doc, newFile) => {
    if (!newFile) return
    
    // Validate PDF
    if (newFile.type !== 'application/pdf' && !newFile.name.toLowerCase().endsWith('.pdf')) {
      alert('Only PDF files are allowed')
      return
    }

    // Validate file size (10MB max)
    const MAX_FILE_SIZE_MB = 10
    const fileSizeMB = newFile.size / (1024 * 1024)
    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      alert(`File size (${fileSizeMB.toFixed(2)}MB) exceeds maximum allowed size of ${MAX_FILE_SIZE_MB}MB`)
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append('file', newFile)

    try {
      const res = await fetch(`${API_BASE}/student/documents/${doc.id}`, {
        method: 'PATCH',
        headers: { ...authHeaders },
        body: formData,
      })
      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.detail || 'Update failed')
      }
      await fetchDocuments()
      await fetchChecklist()
    } catch (err) {
      alert('Update failed: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: '#fbbf24',
      approved: '#10b981',
      rejected: '#ef4444',
      needs_revision: '#f59e0b',
    }
    return colors[status] || '#64748b'
  }

  return (
    <div className="student-page">
      <header className="student-header">
        <h1>Document Center</h1>
        <p>Upload and manage your documents</p>
      </header>

      {/* Upload Form */}
      <div className="panel">
        <h3>Upload Document</h3>
        {replacingDoc && (
          <div style={{
            padding: '0.75rem',
            marginBottom: '1rem',
            borderRadius: '0.5rem',
            background: '#fef3c7',
            border: '1px solid #f59e0b',
            color: '#92400e',
            fontSize: '0.875rem'
          }}>
            ⚠️ A {replacingDoc.document_type.replace(/_/g, ' ')} document already exists. Uploading will replace it.
          </div>
        )}
        <form onSubmit={handleUpload} className="upload-form">
          <div className="form-row">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              required
              className="form-select"
            >
              <option value="">Select document type...</option>
              <option value="passport">Passport</option>
              <option value="transcript">Transcript</option>
              <option value="diploma">Diploma</option>
              <option value="recommendation_letter_1">Recommendation Letter 1</option>
              <option value="recommendation_letter_2">Recommendation Letter 2</option>
              <option value="statement_of_purpose">Statement of Purpose</option>
              <option value="english_proficiency">English Proficiency Test</option>
              <option value="financial_statement">Financial Statement</option>
            </select>
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={(e) => setFile(e.target.files[0])}
              required
              className="form-file"
            />
            <button type="submit" disabled={uploading} className="btn-primary">
              {uploading ? 'Uploading...' : replacingDoc ? 'Replace' : 'Upload'}
            </button>
          </div>
          <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#64748b' }}>
            Only PDF files are accepted (max 10MB). One document per type allowed.
          </p>
        </form>
      </div>

      {/* Checklist */}
      {checklist.length > 0 && (
        <div className="panel">
          <h3>Required Documents Checklist</h3>
          <div className="checklist-grid">
            {checklist.map((item, idx) => (
              <div key={idx} className={`checklist-item ${item.uploaded ? 'completed' : ''}`}>
                <div className="checklist-checkbox">
                  {item.uploaded ? '✓' : '○'}
                </div>
                <div className="checklist-content">
                  <h4>{item.display_name}</h4>
                  {item.status && (
                    <span className={`status-badge status-${item.status}`}>
                      {item.status}
                    </span>
                  )}
                  {item.counselor_comment && (
                    <p className="checklist-comment">{item.counselor_comment}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documents List */}
      <div className="panel">
        <h3>My Documents</h3>
        {loading ? (
          <p>Loading documents...</p>
        ) : documents.length === 0 ? (
          <p>No documents uploaded yet.</p>
        ) : (
          <div className="table-wrapper">
            <table className="applications-table">
              <thead>
                <tr>
                  <th>Document Type</th>
                  <th>File Name</th>
                  <th>Status</th>
                  <th>Uploaded</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id}>
                    <td>
                      <strong>{doc.document_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</strong>
                    </td>
                    <td>{doc.file_name}</td>
                    <td>
                      <span
                        className="status-badge"
                        style={{ 
                          background: getStatusColor(doc.status), 
                          color: '#fff',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '999px',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                        }}
                      >
                        {doc.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>{new Date(doc.uploaded_at).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => handleDownload(doc)}
                          className="btn-secondary"
                          style={{ padding: '0.375rem 0.75rem', fontSize: '0.875rem' }}
                        >
                          View PDF
                        </button>
                        <label
                          className="btn-secondary"
                          style={{ 
                            padding: '0.375rem 0.75rem', 
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                            display: 'inline-block'
                          }}
                        >
                          Replace
                          <input
                            type="file"
                            accept=".pdf,application/pdf"
                            onChange={(e) => {
                              if (e.target.files[0]) {
                                handleReplace(doc, e.target.files[0])
                                e.target.value = '' // Reset input
                              }
                            }}
                            style={{ display: 'none' }}
                          />
                        </label>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="btn-danger"
                          style={{ padding: '0.375rem 0.75rem', fontSize: '0.875rem' }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {documents.length > 0 && documents.some(doc => doc.counselor_comment) && (
          <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0' }}>
            <h4 style={{ marginBottom: '1rem', color: '#1e293b' }}>Counselor Comments</h4>
            {documents.filter(doc => doc.counselor_comment).map((doc) => (
              <div key={doc.id} style={{ marginBottom: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
                <strong style={{ color: '#1e293b' }}>
                  {doc.document_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                </strong>
                <p style={{ margin: '0.5rem 0 0 0', color: '#475569' }}>{doc.counselor_comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Application Center
function ApplicationsPage() {
  const { token } = useAuth()
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingApp, setEditingApp] = useState(null)
  const [viewingApp, setViewingApp] = useState(null)
  const [formData, setFormData] = useState({
    university_name: '',
    program_name: '',
    country: '',
    degree_level: '',
    intake: '',
    application_deadline: '',
    scholarship_amount: '',
    scholarship_currency: 'USD',
  })

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {}

  useEffect(() => {
    fetchApplications()
  }, [token])

  const fetchApplications = async () => {
    try {
      const res = await fetch(`${API_BASE}/student/applications`, {
        headers: { ...authHeaders },
      })
      if (!res.ok) throw new Error('Failed to load applications')
      const data = await res.json()
      setApplications(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const url = editingApp 
        ? `${API_BASE}/student/applications/${editingApp.id}`
        : `${API_BASE}/student/applications`
      const method = editingApp ? 'PATCH' : 'POST'
      
      const payload = {
        ...formData,
        application_deadline: formData.application_deadline || null,
        scholarship_amount: formData.scholarship_amount ? parseFloat(formData.scholarship_amount) : null,
        scholarship_currency: formData.scholarship_amount ? formData.scholarship_currency : null,
      }
      
      // For PATCH, only send changed fields
      if (editingApp) {
        const changed = {}
        Object.keys(payload).forEach(key => {
          if (payload[key] !== (editingApp[key] || '')) {
            changed[key] = payload[key]
          }
        })
        Object.keys(changed).forEach(key => {
          if (changed[key] === '' || changed[key] === null) {
            changed[key] = null
          }
        })
        Object.assign(payload, changed)
      }
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(editingApp ? 'Failed to update application' : 'Failed to create application')
      await fetchApplications()
      setShowForm(false)
      setEditingApp(null)
      resetForm()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleEdit = (app) => {
    setEditingApp(app)
    setFormData({
      university_name: app.university_name || '',
      program_name: app.program_name || '',
      country: app.country || '',
      degree_level: app.degree_level || '',
      intake: app.intake || '',
      application_deadline: app.application_deadline ? new Date(app.application_deadline).toISOString().split('T')[0] : '',
      scholarship_amount: app.scholarship_amount || '',
      scholarship_currency: app.scholarship_currency || 'USD',
    })
    setShowForm(true)
  }

  const handleDelete = async (appId) => {
    if (!window.confirm('Are you sure you want to delete this application?')) return
    try {
      const res = await fetch(`${API_BASE}/student/applications/${appId}`, {
        method: 'DELETE',
        headers: { ...authHeaders },
      })
      if (!res.ok) throw new Error('Failed to delete application')
      await fetchApplications()
    } catch (err) {
      alert('Failed to delete: ' + err.message)
    }
  }

  const handleStatusChange = async (appId, newStatus) => {
    try {
      const res = await fetch(`${API_BASE}/student/applications/${appId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error('Failed to update status')
      await fetchApplications()
    } catch (err) {
      alert('Failed to update status: ' + err.message)
    }
  }

  const resetForm = () => {
    setFormData({
      university_name: '',
      program_name: '',
      country: '',
      degree_level: '',
      intake: '',
      application_deadline: '',
      scholarship_amount: '',
      scholarship_currency: 'USD',
    })
  }

  const getStatusColor = (status) => {
    const statusMap = {
      'draft': '#6b7280',
      'submitted': '#3b82f6',
      'applied': '#3b82f6',
      'under_review': '#f59e0b',
      'accepted': '#10b981',
      'rejected': '#ef4444',
      'deferred': '#8b5cf6',
      'waitlisted': '#f59e0b',
    }
    return statusMap[status] || '#6b7280'
  }

  const formatDate = (dateString) => {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleDateString()
  }

  const formatScholarship = (app) => {
    if (!app.scholarship_amount) return '—'
    const amount = parseFloat(app.scholarship_amount).toLocaleString()
    const currency = app.scholarship_currency || 'USD'
    return `${amount} ${currency}`
  }

  return (
    <div className="student-page">
      <header className="student-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>Applications</h1>
            <p>Manage your university applications</p>
          </div>
          <button 
            onClick={() => {
              setShowForm(!showForm)
              if (showForm) {
                setEditingApp(null)
                resetForm()
              }
            }} 
            className="btn-primary"
          >
            {showForm ? 'Cancel' : '+ New Application'}
          </button>
        </div>
      </header>

      {showForm && (
        <div className="panel">
          <h3>{editingApp ? 'Edit Application' : 'Create New Application'}</h3>
          <form onSubmit={handleSubmit} className="application-form">
            <div className="form-grid">
              <div>
                <label>University Name *</label>
                <input
                  type="text"
                  value={formData.university_name}
                  onChange={(e) => setFormData({ ...formData, university_name: e.target.value })}
                  required
                  className="form-input"
                />
              </div>
              <div>
                <label>Program Name *</label>
                <input
                  type="text"
                  value={formData.program_name}
                  onChange={(e) => setFormData({ ...formData, program_name: e.target.value })}
                  required
                  className="form-input"
                />
              </div>
              <div>
                <label>Country *</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  required
                  className="form-input"
                />
              </div>
              <div>
                <label>Degree Level *</label>
                <select
                  value={formData.degree_level}
                  onChange={(e) => setFormData({ ...formData, degree_level: e.target.value })}
                  required
                  className="form-select"
                >
                  <option value="">Select...</option>
                  <option value="Bachelor's">Bachelor's</option>
                  <option value="Master's">Master's</option>
                  <option value="PhD">PhD</option>
                </select>
              </div>
              <div>
                <label>Intake *</label>
                <input
                  type="text"
                  value={formData.intake}
                  onChange={(e) => setFormData({ ...formData, intake: e.target.value })}
                  placeholder="e.g., Fall 2024"
                  required
                  className="form-input"
                />
              </div>
              <div>
                <label>Application Deadline</label>
                <input
                  type="date"
                  value={formData.application_deadline}
                  onChange={(e) => setFormData({ ...formData, application_deadline: e.target.value })}
                  className="form-input"
                />
              </div>
              <div>
                <label>Scholarship Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.scholarship_amount}
                  onChange={(e) => setFormData({ ...formData, scholarship_amount: e.target.value })}
                  className="form-input"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label>Scholarship Currency</label>
                <select
                  value={formData.scholarship_currency}
                  onChange={(e) => setFormData({ ...formData, scholarship_currency: e.target.value })}
                  className="form-select"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="CAD">CAD</option>
                  <option value="AUD">AUD</option>
                </select>
              </div>
            </div>
            <button type="submit" className="btn-primary">
              {editingApp ? 'Update Application' : 'Create Application'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <p>Loading applications...</p>
      ) : applications.length === 0 ? (
        <div className="panel">
          <p>No applications yet. Create your first application to get started.</p>
        </div>
      ) : (
        <div className="panel">
          <div className="table-wrapper">
            <table className="applications-table">
              <thead>
                <tr>
                  <th>University Name</th>
                  <th>Applied On</th>
                  <th>Status</th>
                  <th>Scholarship</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr 
                    key={app.id}
                    onClick={() => setViewingApp(app)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <div>
                        <strong>{app.university_name}</strong>
                        <div style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>
                          {app.program_name} • {app.country} • {app.degree_level}
                        </div>
                      </div>
                    </td>
                    <td>{formatDate(app.submitted_at || app.created_at)}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <select
                        value={app.status}
                        onChange={(e) => handleStatusChange(app.id, e.target.value)}
                        style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.375rem',
                          border: `1px solid ${getStatusColor(app.status)}`,
                          background: 'white',
                          color: getStatusColor(app.status),
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="draft">Draft</option>
                        <option value="submitted">Submitted</option>
                        <option value="applied">Applied</option>
                        <option value="under_review">Under Review</option>
                        <option value="accepted">Accepted</option>
                        <option value="rejected">Rejected</option>
                        <option value="deferred">Deferred</option>
                        <option value="waitlisted">Waitlisted</option>
                      </select>
                    </td>
                    <td>{formatScholarship(app)}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleEdit(app)}
                          className="btn-secondary"
                          style={{ padding: '0.375rem 0.75rem', fontSize: '0.875rem' }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(app.id)}
                          className="btn-danger"
                          style={{ padding: '0.375rem 0.75rem', fontSize: '0.875rem' }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewingApp && (
        <div 
          className="modal-overlay" 
          onClick={() => setViewingApp(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div 
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '0.75rem',
              padding: '2rem',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, color: '#1e293b' }}>Application Details</h2>
              <button
                onClick={() => setViewingApp(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#64748b',
                  padding: '0.25rem 0.5rem',
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <strong style={{ color: '#64748b', fontSize: '0.875rem' }}>University Name</strong>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.125rem', color: '#1e293b' }}>{viewingApp.university_name}</p>
              </div>
              
              <div>
                <strong style={{ color: '#64748b', fontSize: '0.875rem' }}>Program Name</strong>
                <p style={{ margin: '0.25rem 0 0 0', color: '#1e293b' }}>{viewingApp.program_name}</p>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <strong style={{ color: '#64748b', fontSize: '0.875rem' }}>Country</strong>
                  <p style={{ margin: '0.25rem 0 0 0', color: '#1e293b' }}>{viewingApp.country}</p>
                </div>
                <div>
                  <strong style={{ color: '#64748b', fontSize: '0.875rem' }}>Degree Level</strong>
                  <p style={{ margin: '0.25rem 0 0 0', color: '#1e293b' }}>{viewingApp.degree_level}</p>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <strong style={{ color: '#64748b', fontSize: '0.875rem' }}>Intake</strong>
                  <p style={{ margin: '0.25rem 0 0 0', color: '#1e293b' }}>{viewingApp.intake}</p>
                </div>
                <div>
                  <strong style={{ color: '#64748b', fontSize: '0.875rem' }}>Status</strong>
                  <p style={{ margin: '0.25rem 0 0 0', color: '#1e293b' }}>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '999px',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      background: `${getStatusColor(viewingApp.status)}20`,
                      color: getStatusColor(viewingApp.status),
                    }}>
                      {viewingApp.status.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </p>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <strong style={{ color: '#64748b', fontSize: '0.875rem' }}>Created On</strong>
                  <p style={{ margin: '0.25rem 0 0 0', color: '#1e293b' }}>{formatDate(viewingApp.created_at)}</p>
                </div>
                <div>
                  <strong style={{ color: '#64748b', fontSize: '0.875rem' }}>Applied On</strong>
                  <p style={{ margin: '0.25rem 0 0 0', color: '#1e293b' }}>{formatDate(viewingApp.submitted_at || viewingApp.created_at)}</p>
                </div>
              </div>
              
              {viewingApp.application_deadline && (
                <div>
                  <strong style={{ color: '#64748b', fontSize: '0.875rem' }}>Application Deadline</strong>
                  <p style={{ margin: '0.25rem 0 0 0', color: '#1e293b' }}>{formatDate(viewingApp.application_deadline)}</p>
                </div>
              )}
              
              {viewingApp.decision_date && (
                <div>
                  <strong style={{ color: '#64748b', fontSize: '0.875rem' }}>Decision Date</strong>
                  <p style={{ margin: '0.25rem 0 0 0', color: '#1e293b' }}>{formatDate(viewingApp.decision_date)}</p>
                </div>
              )}
              
              {viewingApp.scholarship_amount && (
                <div>
                  <strong style={{ color: '#64748b', fontSize: '0.875rem' }}>Scholarship</strong>
                  <p style={{ margin: '0.25rem 0 0 0', color: '#1e293b', fontSize: '1.125rem', fontWeight: 600 }}>
                    {formatScholarship(viewingApp)}
                  </p>
                </div>
              )}
              
              {viewingApp.ai_suggestions && (
                <div>
                  <strong style={{ color: '#64748b', fontSize: '0.875rem' }}>AI Suggestions</strong>
                  <p style={{ margin: '0.25rem 0 0 0', color: '#1e293b', whiteSpace: 'pre-wrap' }}>{viewingApp.ai_suggestions}</p>
                </div>
              )}
              
              {viewingApp.counselor_notes && (
                <div>
                  <strong style={{ color: '#64748b', fontSize: '0.875rem' }}>Counselor Notes</strong>
                  <p style={{ margin: '0.25rem 0 0 0', color: '#1e293b', whiteSpace: 'pre-wrap' }}>{viewingApp.counselor_notes}</p>
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0' }}>
              <button
                onClick={() => {
                  setViewingApp(null)
                  handleEdit(viewingApp)
                }}
                className="btn-secondary"
                style={{ flex: 1 }}
              >
                Edit Application
              </button>
              <button
                onClick={() => {
                  setViewingApp(null)
                  handleDelete(viewingApp.id)
                }}
                className="btn-danger"
                style={{ flex: 1 }}
              >
                Delete Application
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Payments Page
function PaymentsPage() {
  const { token } = useAuth()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {}

  useEffect(() => {
    fetchPayments()
  }, [token])

  const fetchPayments = async () => {
    try {
      const res = await fetch(`${API_BASE}/student/payments`, {
        headers: { ...authHeaders },
      })
      if (!res.ok) throw new Error('Failed to load payments')
      const data = await res.json()
      setPayments(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const isOverdue = (payment) => {
    return payment.due_date && new Date(payment.due_date) < new Date() && payment.status !== 'paid'
  }

  return (
    <div className="student-page">
      <header className="student-header">
        <h1>Payments</h1>
        <p>View invoices and track payments</p>
      </header>

      {loading ? (
        <p>Loading payments...</p>
      ) : payments.length === 0 ? (
        <div className="panel">
          <p>No payments or invoices yet.</p>
        </div>
      ) : (
        <div className="payments-list">
          {payments.map((payment) => (
            <div key={payment.id} className={`payment-card ${isOverdue(payment) ? 'overdue' : ''}`}>
              <div className="payment-header">
                <div>
                  <h3>{payment.description}</h3>
                  <p className="invoice-number">Invoice: {payment.invoice_number}</p>
                </div>
                <div className="payment-amount">
                  <strong>{payment.currency} {payment.amount.toLocaleString()}</strong>
                  <span className={`status-badge status-${payment.status} ${isOverdue(payment) ? 'overdue-badge' : ''}`}>
                    {isOverdue(payment) ? 'Overdue' : payment.status}
                  </span>
                </div>
              </div>
              {payment.due_date && (
                <p className="due-date">
                  Due: {new Date(payment.due_date).toLocaleDateString()}
                  {isOverdue(payment) && <span className="overdue-warning"> (Overdue)</span>}
                </p>
              )}
              {payment.paid_at && (
                <p className="paid-date">Paid: {new Date(payment.paid_at).toLocaleDateString()}</p>
              )}
              {payment.is_installment && (
                <p className="installment-info">
                  Installment {payment.installment_number} of {payment.total_installments}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Format message timestamp nicely
function formatMessageTime(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  // Just now (less than 1 minute)
  if (diffMins < 1) return 'Just now'
  
  // Minutes ago (less than 1 hour)
  if (diffMins < 60) return `${diffMins}m ago`
  
  // Hours ago (less than 24 hours)
  if (diffHours < 24) return `${diffHours}h ago`
  
  // Today - show time only
  if (diffDays === 0) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  }
  
  // Yesterday
  if (diffDays === 1) return 'Yesterday'
  
  // This week - show day and time
  if (diffDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit', hour12: true })
  }
  
  // Older - show date and time
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
}

// Messages Page
function MessagesPage() {
  const { token } = useAuth()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {}

  useEffect(() => {
    fetchMessages()
    const interval = setInterval(fetchMessages, 5000) // Poll every 5 seconds
    return () => clearInterval(interval)
  }, [token])

  const fetchMessages = async () => {
    try {
      const res = await fetch(`${API_BASE}/student/messages`, {
        headers: { ...authHeaders },
      })
      if (res.ok) {
        const data = await res.json()
        setMessages(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    setSending(true)
    try {
      const res = await fetch(`${API_BASE}/student/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ content: newMessage }),
      })
      if (!res.ok) throw new Error('Failed to send message')
      setNewMessage('')
      await fetchMessages()
    } catch (err) {
      alert('Failed to send message: ' + err.message)
    } finally {
      setSending(false)
    }
  }

  const markAsRead = async (messageId) => {
    try {
      await fetch(`${API_BASE}/student/messages/${messageId}/read`, {
        method: 'PATCH',
        headers: { ...authHeaders },
      })
      await fetchMessages()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="student-page">
      <header className="student-header">
        <h1>Messages</h1>
        <p>Chat with your counselor</p>
      </header>

      <div className="messages-container">
        <div className="messages-list">
          {loading ? (
            <p>Loading messages...</p>
          ) : messages.length === 0 ? (
            <p>No messages yet. Start a conversation!</p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`message-item ${msg.sender_type === 'student' ? 'sent' : 'received'} ${!msg.is_read && msg.sender_type !== 'student' ? 'unread' : ''}`}
                onClick={() => !msg.is_read && msg.sender_type !== 'student' && markAsRead(msg.id)}
              >
                <div className="message-header">
                  <strong>{msg.sender_type === 'student' ? 'You' : msg.sender_type === 'ai' ? 'AI Assistant' : 'Counselor'}</strong>
                  <span className="message-time">
                    {formatMessageTime(msg.created_at)}
                  </span>
                </div>
                <div className="message-content">{msg.content}</div>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleSend} className="message-form">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            rows={3}
            className="message-input"
          />
          <button type="submit" disabled={sending || !newMessage.trim()} className="btn-primary">
            {sending ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  )
}

// Timeline Page
function TimelinePage() {
  const { token } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState('')

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {}

  useEffect(() => {
    fetchTimeline()
  }, [token, categoryFilter])

  const fetchTimeline = async () => {
    try {
      const url = `${API_BASE}/student/timeline${categoryFilter ? `?category=${categoryFilter}` : ''}`
      const res = await fetch(url, {
        headers: { ...authHeaders },
      })
      if (res.ok) {
        const data = await res.json()
        setEvents(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="student-page">
      <header className="student-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>Timeline</h1>
            <p>View your complete journey</p>
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="form-select"
            style={{ width: 'auto' }}
          >
            <option value="">All Categories</option>
            <option value="documents">Documents</option>
            <option value="applications">Applications</option>
            <option value="visa">Visa</option>
            <option value="payments">Payments</option>
            <option value="communication">Communication</option>
          </select>
        </div>
      </header>

      {loading ? (
        <p>Loading timeline...</p>
      ) : events.length === 0 ? (
        <div className="panel">
          <p>No timeline events yet.</p>
        </div>
      ) : (
        <div className="timeline-container">
          {events.map((event) => (
            <div key={event.id} className="timeline-event">
              <div className="timeline-icon">{getActivityIcon(event.event_type)}</div>
              <div className="timeline-content">
                <div className="timeline-header">
                  <h4>{event.title}</h4>
                  <span className="timeline-category">{event.category}</span>
                </div>
                {event.description && <p>{event.description}</p>}
                <span className="timeline-time">
                  {new Date(event.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Main Student Dashboard Layout
export default function StudentDashboard() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="student-portal">
      <aside className="student-sidebar">
        <div className="sidebar-header">
          <h2>Student Portal</h2>
        </div>
        <nav className="student-nav">
          <NavLink to="/student/dashboard" end className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <span className="nav-icon">📊</span>
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/student/dashboard/documents" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <span className="nav-icon">📁</span>
            <span>Documents</span>
          </NavLink>
          <NavLink to="/student/dashboard/applications" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <span className="nav-icon">🎓</span>
            <span>Applications</span>
          </NavLink>
          <NavLink to="/student/dashboard/payments" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <span className="nav-icon">💳</span>
            <span>Payments</span>
          </NavLink>
          <NavLink to="/student/dashboard/messages" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <span className="nav-icon">💬</span>
            <span>Messages</span>
          </NavLink>
          <NavLink to="/student/dashboard/timeline" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <span className="nav-icon">📅</span>
            <span>Timeline</span>
          </NavLink>
        </nav>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </aside>
      <main className="student-main">
        <Routes>
          <Route index element={<DashboardOverview />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="applications" element={<ApplicationsPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="timeline" element={<TimelinePage />} />
        </Routes>
      </main>
    </div>
  )
}
