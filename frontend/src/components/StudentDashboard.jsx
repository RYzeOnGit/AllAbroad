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

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {}

  useEffect(() => {
    fetchDocuments()
    fetchChecklist()
  }, [token])

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
      if (!res.ok) throw new Error('Upload failed')
      await fetchDocuments()
      await fetchChecklist()
      setFile(null)
      setSelectedType('')
      e.target.reset()
    } catch (err) {
      alert('Upload failed: ' + err.message)
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
              accept=".pdf,.doc,.docx"
              onChange={(e) => setFile(e.target.files[0])}
              required
              className="form-file"
            />
            <button type="submit" disabled={uploading} className="btn-primary">
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
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
          <div className="documents-list">
            {documents.map((doc) => (
              <div key={doc.id} className="document-card">
                <div className="document-header">
                  <h4>{doc.document_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h4>
                  <span
                    className="status-badge"
                    style={{ background: getStatusColor(doc.status), color: '#fff' }}
                  >
                    {doc.status}
                  </span>
                </div>
                <p className="document-name">{doc.file_name}</p>
                {doc.counselor_comment && (
                  <div className="document-comment">
                    <strong>Counselor Comment:</strong> {doc.counselor_comment}
                  </div>
                )}
                <div className="document-meta">
                  <span>Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}</span>
                  {doc.reviewed_at && (
                    <span>Reviewed: {new Date(doc.reviewed_at).toLocaleDateString()}</span>
                  )}
                </div>
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
  const [formData, setFormData] = useState({
    university_name: '',
    program_name: '',
    country: '',
    degree_level: '',
    intake: '',
    application_deadline: '',
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
      const res = await fetch(`${API_BASE}/student/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          ...formData,
          application_deadline: formData.application_deadline || null,
        }),
      })
      if (!res.ok) throw new Error('Failed to create application')
      await fetchApplications()
      setShowForm(false)
      setFormData({
        university_name: '',
        program_name: '',
        country: '',
        degree_level: '',
        intake: '',
        application_deadline: '',
      })
    } catch (err) {
      alert('Failed to create application: ' + err.message)
    }
  }

  const handleSubmitApplication = async (appId) => {
    try {
      const res = await fetch(`${API_BASE}/student/applications/${appId}/submit`, {
        method: 'PATCH',
        headers: { ...authHeaders },
      })
      if (!res.ok) throw new Error('Failed to submit application')
      await fetchApplications()
    } catch (err) {
      alert('Failed to submit: ' + err.message)
    }
  }

  return (
    <div className="student-page">
      <header className="student-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>Application Center</h1>
            <p>Track your university applications</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            {showForm ? 'Cancel' : '+ New Application'}
          </button>
        </div>
      </header>

      {showForm && (
        <div className="panel">
          <h3>Create New Application</h3>
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
            </div>
            <button type="submit" className="btn-primary">Create Application</button>
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
        <div className="applications-grid">
          {applications.map((app) => (
            <div key={app.id} className="application-card">
              <div className="application-header">
                <h3>{app.university_name}</h3>
                <span className={`status-badge status-${app.status}`}>
                  {app.status.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="application-program">{app.program_name}</p>
              <div className="application-details">
                <span>{app.country}</span>
                <span>•</span>
                <span>{app.degree_level}</span>
                <span>•</span>
                <span>{app.intake}</span>
              </div>
              {app.application_deadline && (
                <p className="application-deadline">
                  Deadline: {new Date(app.application_deadline).toLocaleDateString()}
                </p>
              )}
              {app.ai_suggestions && (
                <div className="ai-suggestions">
                  <strong>AI Suggestions:</strong>
                  <p>{app.ai_suggestions}</p>
                </div>
              )}
              {app.status === 'draft' && (
                <button
                  onClick={() => handleSubmitApplication(app.id)}
                  className="btn-primary"
                  style={{ width: '100%', marginTop: '1rem' }}
                >
                  Submit Application
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Visa Center
function VisaPage() {
  const { token } = useAuth()
  const [visa, setVisa] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    country: '',
    visa_type: 'student',
    estimated_processing_days: '',
  })

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {}

  useEffect(() => {
    fetchVisa()
  }, [token])

  const fetchVisa = async () => {
    try {
      const res = await fetch(`${API_BASE}/student/visa`, {
        headers: { ...authHeaders },
      })
      if (res.ok) {
        const data = await res.json()
        setVisa(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch(`${API_BASE}/student/visa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          ...formData,
          estimated_processing_days: formData.estimated_processing_days ? parseInt(formData.estimated_processing_days) : null,
        }),
      })
      if (!res.ok) throw new Error('Failed to create visa application')
      await fetchVisa()
      setShowForm(false)
    } catch (err) {
      alert('Failed to create visa application: ' + err.message)
    }
  }

  return (
    <div className="student-page">
      <header className="student-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>Visa Center</h1>
            <p>Track your visa application progress</p>
          </div>
          {!visa && (
            <button onClick={() => setShowForm(!showForm)} className="btn-primary">
              {showForm ? 'Cancel' : '+ Start Visa Application'}
            </button>
          )}
        </div>
      </header>

      {showForm && !visa && (
        <div className="panel">
          <h3>Create Visa Application</h3>
          <form onSubmit={handleCreate} className="visa-form">
            <div className="form-grid">
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
                <label>Visa Type *</label>
                <select
                  value={formData.visa_type}
                  onChange={(e) => setFormData({ ...formData, visa_type: e.target.value })}
                  required
                  className="form-select"
                >
                  <option value="student">Student Visa</option>
                  <option value="tourist">Tourist Visa</option>
                  <option value="work">Work Visa</option>
                </select>
              </div>
              <div>
                <label>Estimated Processing Days</label>
                <input
                  type="number"
                  value={formData.estimated_processing_days}
                  onChange={(e) => setFormData({ ...formData, estimated_processing_days: e.target.value })}
                  className="form-input"
                />
              </div>
            </div>
            <button type="submit" className="btn-primary">Create Visa Application</button>
          </form>
        </div>
      )}

      {loading ? (
        <p>Loading visa information...</p>
      ) : visa ? (
        <div className="panel">
          <div className="visa-status">
            <h3>Visa Status: <span className={`status-badge status-${visa.status}`}>{visa.status.replace(/_/g, ' ')}</span></h3>
            {visa.current_stage && <p>Current Stage: {visa.current_stage}</p>}
          </div>
          <div className="visa-details">
            <div className="detail-item">
              <strong>Country:</strong> {visa.country}
            </div>
            <div className="detail-item">
              <strong>Visa Type:</strong> {visa.visa_type}
            </div>
            {visa.interview_date && (
              <div className="detail-item">
                <strong>Interview Date:</strong> {new Date(visa.interview_date).toLocaleString()}
              </div>
            )}
            {visa.interview_location && (
              <div className="detail-item">
                <strong>Interview Location:</strong> {visa.interview_location}
              </div>
            )}
            {visa.estimated_processing_days && (
              <div className="detail-item">
                <strong>Estimated Processing:</strong> {visa.estimated_processing_days} days
              </div>
            )}
            {visa.counselor_notes && (
              <div className="detail-item">
                <strong>Counselor Notes:</strong>
                <p>{visa.counselor_notes}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="panel">
          <p>No visa application yet. Start one to begin tracking your visa progress.</p>
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

// University Comparison
function ComparisonPage() {
  const { token } = useAuth()
  const [applications, setApplications] = useState([])
  const [comparison, setComparison] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [loading, setLoading] = useState(true)

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {}

  useEffect(() => {
    fetchApplications()
  }, [token])

  useEffect(() => {
    if (selectedIds.length > 0) {
      fetchComparison()
    } else {
      setComparison([])
    }
  }, [selectedIds])

  const fetchApplications = async () => {
    try {
      const res = await fetch(`${API_BASE}/student/applications`, {
        headers: { ...authHeaders },
      })
      if (res.ok) {
        const data = await res.json()
        setApplications(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchComparison = async () => {
    try {
      const res = await fetch(`${API_BASE}/student/applications/compare?application_ids=${selectedIds.join(',')}`, {
        headers: { ...authHeaders },
      })
      if (res.ok) {
        const data = await res.json()
        setComparison(data)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const toggleSelection = (appId) => {
    setSelectedIds(prev => 
      prev.includes(appId) 
        ? prev.filter(id => id !== appId)
        : [...prev, appId]
    )
  }

  return (
    <div className="student-page">
      <header className="student-header">
        <h1>University Comparison</h1>
        <p>Compare universities side-by-side</p>
      </header>

      {loading ? (
        <p>Loading applications...</p>
      ) : applications.length === 0 ? (
        <div className="panel">
          <p>No applications to compare. Create applications first.</p>
        </div>
      ) : (
        <>
          <div className="panel">
            <h3>Select Applications to Compare (2-4)</h3>
            <div className="comparison-selector">
              {applications.map((app) => (
                <label key={app.id} className="comparison-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(app.id)}
                    onChange={() => toggleSelection(app.id)}
                    disabled={!selectedIds.includes(app.id) && selectedIds.length >= 4}
                  />
                  <span>{app.university_name} - {app.program_name}</span>
                </label>
              ))}
            </div>
          </div>

          {comparison.length > 0 && (
            <div className="panel">
              <h3>Comparison</h3>
              <div className="comparison-table">
                <table>
                  <thead>
                    <tr>
                      <th>University</th>
                      {comparison.map((uni, idx) => (
                        <th key={idx}>{uni.university_name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Program</strong></td>
                      {comparison.map((uni, idx) => (
                        <td key={idx}>{uni.program_name}</td>
                      ))}
                    </tr>
                    <tr>
                      <td><strong>Country</strong></td>
                      {comparison.map((uni, idx) => (
                        <td key={idx}>{uni.country}</td>
                      ))}
                    </tr>
                    <tr>
                      <td><strong>Status</strong></td>
                      {comparison.map((uni, idx) => (
                        <td key={idx}>
                          <span className={`status-badge status-${uni.application_status}`}>
                            {uni.application_status}
                          </span>
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td><strong>AI Score</strong></td>
                      {comparison.map((uni, idx) => (
                        <td key={idx}>
                          {uni.ai_recommendation_score ? `${uni.ai_recommendation_score}/100` : 'N/A'}
                        </td>
                      ))}
                    </tr>
                    {comparison.some(u => u.highlights) && (
                      <tr>
                        <td><strong>Highlights</strong></td>
                        {comparison.map((uni, idx) => (
                          <td key={idx}>
                            {uni.highlights && (
                              <ul>
                                {uni.highlights.map((h, i) => (
                                  <li key={i}>{h}</li>
                                ))}
                              </ul>
                            )}
                          </td>
                        ))}
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
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
        <p>Chat with your counselor and AI assistant</p>
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
                    {new Date(msg.created_at).toLocaleString()}
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
          <NavLink to="/student/dashboard/visa" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <span className="nav-icon">✈️</span>
            <span>Visa</span>
          </NavLink>
          <NavLink to="/student/dashboard/payments" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <span className="nav-icon">💳</span>
            <span>Payments</span>
          </NavLink>
          <NavLink to="/student/dashboard/compare" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <span className="nav-icon">⚖️</span>
            <span>Compare</span>
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
          <Route path="visa" element={<VisaPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="compare" element={<ComparisonPage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="timeline" element={<TimelinePage />} />
        </Routes>
      </main>
    </div>
  )
}
