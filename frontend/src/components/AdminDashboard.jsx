import React, { useCallback, useEffect, useRef, useState, createContext, useContext } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { NavLink, Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { DEGREES, SUBJECTS } from '../constants/leadOptions'
import './AdminDashboard.css'

const API_BASE = '/api'

// Shared utility function for updating lead status
async function updateLeadStatus(leadId, newStatus, version, authHeaders, onSuccess) {
  // If version not provided, fetch the lead first to get its version
  let leadVersion = version
  if (leadVersion === null) {
    try {
      const leadRes = await fetch(`${API_BASE}/v1/leads/${leadId}`, {
        headers: { ...authHeaders },
      })
      if (leadRes.ok) {
        const leadData = await leadRes.json()
        leadVersion = leadData.version || 0
      } else {
        leadVersion = 0 // Fallback
      }
    } catch {
      leadVersion = 0 // Fallback
    }
  }
  
  const response = await fetch(`${API_BASE}/v1/leads/${leadId}/status?new_status=${encodeURIComponent(newStatus)}&version=${leadVersion}`, {
    method: 'PATCH',
    headers: { ...authHeaders },
  })
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || `HTTP ${response.status}: Failed to update status`)
  }
  
  // Get the updated lead from response to return the new version
  const updatedLead = await response.json()
  
  // Call success callback if provided (for silent refresh)
  if (onSuccess) {
    onSuccess()
  }
  
  // Return updated lead so caller can update local state
  return updatedLead
}

function formatBudget(lead) {
  const c = lead.budget_currency || ''
  const fmt = (n) => (n != null && n !== '') ? Number(n).toLocaleString() : null
  const min = fmt(lead.budget_min)
  const max = fmt(lead.budget_max)
  if (min != null || max != null) {
    if (min != null && max != null) return `${min} – ${max} ${c}`.trim()
    if (min != null) return `From ${min} ${c}`.trim()
    return `Up to ${max} ${c}`.trim()
  }
  if (lead.budget_amount != null && lead.budget_currency) {
    return `${Number(lead.budget_amount).toLocaleString()} ${lead.budget_currency}`
  }
  return lead.budget || '—'
}

// Simple context removed - each page is now independent

function StatusPill({ status }) {
  const label = status || 'unknown'
  return <span className={`status-pill status-${label.toLowerCase()}`}>{label}</span>
}

function LeadsTable({
  leads, page, totalPages, onPageChange, onStatusChange, search, onSearchChange,
  degreeFilter, subjectFilter, subjectOtherFilter, onDegreeFilterChange, onSubjectFilterChange, onSubjectOtherFilterChange
}) {
  return (
    <div className="panel">
      <div className="panel-header">
        <h3>Leads</h3>
        <span className="panel-subtitle">Paginated list of all leads</span>
      </div>
      <div className="admin-search-row admin-filters-row">
        <input
          type="text"
          className="admin-search-input admin-filters-search"
          placeholder="Search by name, phone, country, target country, degree, subject, or source..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <div className="admin-filters-group">
          <select
            className="admin-filter-select"
            value={degreeFilter || ''}
            onChange={(e) => onDegreeFilterChange(e.target.value || null)}
          >
            <option value="">All degrees</option>
            {DEGREES.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <select
            className="admin-filter-select"
            value={subjectFilter || ''}
            onChange={(e) => onSubjectFilterChange(e.target.value || null)}
          >
            <option value="">All subjects</option>
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {subjectFilter === 'Other' && (
            <input
              type="text"
              className="admin-search-input admin-filter-subject-other"
              placeholder="Specify subject"
              value={subjectOtherFilter || ''}
              onChange={(e) => onSubjectOtherFilterChange(e.target.value)}
            />
          )}
        </div>
      </div>
      <div className="table-wrapper">
        <table className="leads-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Phone</th>
              <th>From → To</th>
              <th>Intake</th>
              <th>Degree</th>
              <th>Subject</th>
              <th>Budget</th>
              <th>Source</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 && (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '1.5rem' }}>
                  No leads yet.
                </td>
              </tr>
            )}
            {leads.map((lead) => (
              <tr key={lead.id}>
                <td>{lead.id}</td>
                <td>{lead.name}</td>
                <td>{lead.phone}</td>
                <td>
                  {lead.country} → {lead.target_country}
                </td>
                <td>{lead.intake}</td>
                <td>{lead.degree || '—'}</td>
                <td>{lead.subject || '—'}</td>
                <td>{formatBudget(lead)}</td>
                <td>{lead.source}</td>
                <td>
                  <select
                    className="status-select"
                    value={lead.status || 'new'}
                    onChange={(e) => onStatusChange(lead.id, e.target.value, lead.version)}
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="won">Won</option>
                    <option value="lost">Lost</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
            Next
          </button>
        </div>
      )}
    </div>
  )
}

function DraggableKanbanCard({ lead, onStatusChange }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `lead-${lead.id}` })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`kanban-card ${isDragging ? 'dragging' : ''}`}
      {...attributes}
      {...listeners}
    >
      <div className="kanban-card-header">
        <span className="kanban-name">{lead.name}</span>
        <StatusPill status={lead.status} />
      </div>
      <div className="kanban-card-body">
        <div className="kanban-row">
          <span>{lead.country} → {lead.target_country}</span>
        </div>
        <div className="kanban-row">
          <span>{lead.intake}</span>
        </div>
        <div className="kanban-row">
          <span>{lead.degree || '—'}</span>
          {lead.degree && lead.subject && <span className="kanban-separator">•</span>}
          <span>{lead.subject || '—'}</span>
        </div>
        <div className="kanban-row meta">
          <span>{lead.source}</span>
          <span>{formatBudget(lead)}</span>
        </div>
      </div>
      <div className="kanban-card-footer" onClick={(e) => e.stopPropagation()}>
        <select
          className="status-select small"
          value={lead.status || 'new'}
          onChange={(e) => {
            e.stopPropagation()
            onStatusChange(lead.id, e.target.value, lead.version)
          }}
        >
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="qualified">Qualified</option>
          <option value="won">Won</option>
          <option value="lost">Lost</option>
        </select>
      </div>
    </div>
  )
}

function DroppableKanbanColumn({ title, statusKey, leads, onStatusChange }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${statusKey}`,
    data: {
      type: 'column',
      statusKey,
    },
  })

  const leadIds = leads.map((lead) => `lead-${lead.id}`)

  return (
    <div
      ref={setNodeRef}
      className={`kanban-column ${isOver ? 'drag-over' : ''}`}
    >
      <div className="kanban-column-header">
        <h4>{title}</h4>
        <span className="kanban-count">{leads.length}</span>
      </div>
      <div className="kanban-column-body">
        {leads.length === 0 && <div className="kanban-empty">No leads</div>}
        <SortableContext items={leadIds} strategy={verticalListSortingStrategy}>
          {leads.map((lead) => (
            <DraggableKanbanCard
              key={lead.id}
              lead={lead}
              onStatusChange={onStatusChange}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  )
}


function KanbanView({ allLeads, onStatusChange }) {
  const [activeId, setActiveId] = useState(null)
  const [items, setItems] = useState({
    new: [],
    contacted: [],
    qualified: [],
    won: [],
    lost: [],
  })
  const [error, setError] = useState(null)
  const [originalPosition, setOriginalPosition] = useState(null) // Track original position for rollback
  const pendingUpdateRef = useRef(null) // Track pending status update to prevent race conditions
  const isProcessingRef = useRef(false) // Prevent multiple simultaneous updates

  // Initialize items from allLeads
  useEffect(() => {
    // Skip update if we have a pending optimistic update for the same lead
    if (pendingUpdateRef.current) {
      const { leadId, newStatus } = pendingUpdateRef.current
      // Check if the backend data already reflects our change
      const leadInNewStatus = allLeads.find(l => l.id === leadId && (l.status || 'new').toLowerCase() === newStatus)
      if (leadInNewStatus) {
        // Backend has caught up, clear the pending update
        pendingUpdateRef.current = null
      } else {
        // Backend hasn't updated yet, keep our optimistic state
        return
      }
    }
    
    const byStatus = {
      new: [],
      contacted: [],
      qualified: [],
      won: [],
      lost: [],
    }

    allLeads.forEach((lead) => {
      const key = (lead.status || 'new').toLowerCase()
      if (byStatus[key]) {
        byStatus[key].push(lead)
      }
    })

    setItems(byStatus)
  }, [allLeads])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Reduced from 8px for smoother activation
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event) => {
    setActiveId(event.active.id)
    setError(null) // Clear any previous errors
    
    // Store original position for potential rollback
    const activeId = event.active.id.toString()
    const leadIdMatch = activeId.match(/^lead-(\d+)$/)
    if (leadIdMatch) {
      const leadId = parseInt(leadIdMatch[1])
      let currentStatus = null
      for (const [statusKey, leads] of Object.entries(items)) {
        if (leads.some((l) => l.id === leadId)) {
          currentStatus = statusKey
          break
        }
      }
      setOriginalPosition({ leadId, status: currentStatus })
    }
  }

  const handleDragEnd = async (event) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) {
      setOriginalPosition(null)
      return
    }

    const activeId = active.id.toString()
    const overId = over.id.toString()

    // Extract lead ID from active
    const leadIdMatch = activeId.match(/^lead-(\d+)$/)
    if (!leadIdMatch) {
      setOriginalPosition(null)
      return
    }

    const leadId = parseInt(leadIdMatch[1])
    let newStatus = null

    // Check if dropping on a column
    const columnMatch = overId.match(/^column-(.+)$/)
    if (columnMatch) {
      newStatus = columnMatch[1]
    } else {
      // If dropping on another card, find which column it's in
      const overLeadMatch = overId.match(/^lead-(\d+)$/)
      if (overLeadMatch) {
        // Find the column this lead belongs to
        for (const [statusKey, leads] of Object.entries(items)) {
          if (leads.some((l) => l.id === parseInt(overLeadMatch[1]))) {
            newStatus = statusKey
            break
          }
        }
      }
    }

    if (!newStatus) {
      setOriginalPosition(null)
      return
    }

    // Find current status using current items state
    let currentStatus = null
    let lead = null
    for (const [statusKey, leads] of Object.entries(items)) {
      const found = leads.find((l) => l.id === leadId)
      if (found) {
        currentStatus = statusKey
        lead = found
        break
      }
    }

    // Only update if status changed and we're not already processing
    if (currentStatus && currentStatus !== newStatus && lead && !isProcessingRef.current) {
      isProcessingRef.current = true
      
      // Store snapshot of original items for rollback
      const originalItemsSnapshot = JSON.parse(JSON.stringify(items))
      
      // Track pending update
      pendingUpdateRef.current = { leadId, newStatus }
      
      // Optimistically update UI
      setItems((prevItems) => {
        const updated = { ...prevItems }
        updated[currentStatus] = updated[currentStatus].filter((l) => l.id !== leadId)
        updated[newStatus] = [...updated[newStatus], { ...lead, status: newStatus }]
        return updated
      })

      try {
        // Call backend to update status - pass version if available
        // Use null if version is undefined/0, which will trigger a fetch
        const leadVersion = (lead.version !== undefined && lead.version !== null) ? lead.version : null
        const updatedLead = await onStatusChange(leadId, newStatus, leadVersion)
        
        // Update the lead in our local state with the new version
        if (updatedLead && updatedLead.version !== undefined) {
          setItems((prevItems) => {
            const updated = { ...prevItems }
            // Find and update the lead in the new status column
            const leadIndex = updated[newStatus].findIndex((l) => l.id === leadId)
            if (leadIndex !== -1) {
              updated[newStatus] = [...updated[newStatus]]
              updated[newStatus][leadIndex] = { ...updated[newStatus][leadIndex], version: updatedLead.version }
            }
            return updated
          })
        }
        
        setOriginalPosition(null) // Clear original position on success
        // Keep pendingUpdateRef until useEffect sees the backend update
      } catch (err) {
        // Rollback on failure - restore original snapshot
        pendingUpdateRef.current = null
        setItems(originalItemsSnapshot)
        
        // Extract error message properly
        let errorMessage = 'Unknown error'
        if (err instanceof Error) {
          errorMessage = err.message
        } else if (typeof err === 'string') {
          errorMessage = err
        } else if (err && typeof err === 'object') {
          errorMessage = err.message || err.detail || err.error || JSON.stringify(err)
        }
        
        setError(`Failed to update lead status: ${errorMessage}`)
        setOriginalPosition(null)
        
        // Auto-clear error after 5 seconds
        setTimeout(() => setError(null), 5000)
      } finally {
        isProcessingRef.current = false
      }
    } else {
      setOriginalPosition(null)
    }
  }

  const activeLead = activeId
    ? Object.values(items)
        .flat()
        .find((lead) => `lead-${lead.id}` === activeId)
    : null

  return (
    <div className="panel">
      <div className="panel-header">
        <h3>Kanban Board</h3>
        <span className="panel-subtitle">Drag and drop leads to change status</span>
      </div>
      {error && (
        <div className="admin-alert admin-alert-error" role="alert">
          <strong>Error:</strong> {error}
        </div>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="kanban-board">
          <DroppableKanbanColumn
            title="New"
            statusKey="new"
            leads={items.new}
            onStatusChange={onStatusChange}
          />
          <DroppableKanbanColumn
            title="Contacted"
            statusKey="contacted"
            leads={items.contacted}
            onStatusChange={onStatusChange}
          />
          <DroppableKanbanColumn
            title="Qualified"
            statusKey="qualified"
            leads={items.qualified}
            onStatusChange={onStatusChange}
          />
          <DroppableKanbanColumn
            title="Won"
            statusKey="won"
            leads={items.won}
            onStatusChange={onStatusChange}
          />
          <DroppableKanbanColumn
            title="Lost"
            statusKey="lost"
            leads={items.lost}
            onStatusChange={onStatusChange}
          />
        </div>
        <DragOverlay>
          {activeLead ? (
            <div className="kanban-card dragging-overlay">
              <div className="kanban-card-header">
                <span className="kanban-name">{activeLead.name}</span>
                <StatusPill status={activeLead.status} />
              </div>
              <div className="kanban-card-body">
                <div className="kanban-row">
                  <span>{activeLead.country} → {activeLead.target_country}</span>
                </div>
                <div className="kanban-row">
                  <span>{activeLead.intake}</span>
                </div>
                <div className="kanban-row">
                  <span>{activeLead.degree || '—'}</span>
                  <span>{activeLead.subject || '—'}</span>
                </div>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}

function StatsView({ stats }) {
  const conversionRates = stats.conversion_rates || {}
  const trends = stats.trends || {}
  const sourcePerformance = stats.source_performance || {}
  const countryAnalytics = stats.country_analytics || {}
  const timeMetrics = stats.time_metrics || {}

  const formatGrowth = (value) => {
    if (value === 0) return { text: '0%', isPositive: null }
    const isPositive = value > 0
    return {
      text: `${isPositive ? '+' : ''}${value}%`,
      isPositive,
    }
  }

  const weekGrowth = formatGrowth(trends.week_growth || 0)
  const monthGrowth = formatGrowth(trends.month_growth || 0)

  return (
    <div className="stats-container">
      {/* Key Metrics Overview */}
      <div className="panel">
        <div className="panel-header">
          <h3>Key Performance Indicators</h3>
          <span className="panel-subtitle">Core business metrics</span>
        </div>
        <div className="stats-grid">
          <div className="stat-card primary">
            <span className="stat-label">Total Leads</span>
            <span className="stat-value">{stats.total || 0}</span>
            <span className="stat-trend">
              {trends.leads_this_month ? `${trends.leads_this_month} this month` : 'No data'}
            </span>
          </div>
          
          <div className="stat-card success">
            <span className="stat-label">Win Rate</span>
            <span className="stat-value">{conversionRates.won_rate || 0}%</span>
            <span className="stat-trend">
              {conversionRates.qualified_to_win_rate 
                ? `${conversionRates.qualified_to_win_rate}% from qualified`
                : 'No qualified leads'}
            </span>
          </div>
          
          <div className="stat-card info">
            <span className="stat-label">Qualified Rate</span>
            <span className="stat-value">{conversionRates.qualified_rate || 0}%</span>
            <span className="stat-trend">
              {stats.by_status?.qualified || 0} of {stats.total || 0} leads
            </span>
          </div>
          
          <div className="stat-card warning">
            <span className="stat-label">Contact Rate</span>
            <span className="stat-value">{conversionRates.contact_rate || 0}%</span>
            <span className="stat-trend">
              {stats.by_status?.contacted || 0} contacted
            </span>
          </div>
        </div>
      </div>

      {/* Trends & Growth */}
      <div className="panel">
        <div className="panel-header">
          <h3>Trends & Growth</h3>
          <span className="panel-subtitle">Lead generation velocity</span>
        </div>
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-label">Leads This Week</span>
            <span className="stat-value">{trends.leads_this_week || 0}</span>
            <span className={`stat-trend ${weekGrowth.isPositive === true ? 'positive' : weekGrowth.isPositive === false ? 'negative' : ''}`}>
              {weekGrowth.text} vs previous week
            </span>
          </div>
          
          <div className="stat-card">
            <span className="stat-label">Leads This Month</span>
            <span className="stat-value">{trends.leads_this_month || 0}</span>
            <span className={`stat-trend ${monthGrowth.isPositive === true ? 'positive' : monthGrowth.isPositive === false ? 'negative' : ''}`}>
              {monthGrowth.text} vs previous month
            </span>
          </div>
          
          <div className="stat-card">
            <span className="stat-label">Avg Daily (Week)</span>
            <span className="stat-value">{trends.avg_daily_leads_week || 0}</span>
            <span className="stat-trend">Leads per day</span>
          </div>
          
          <div className="stat-card">
            <span className="stat-label">Avg Daily (Month)</span>
            <span className="stat-value">{trends.avg_daily_leads_month || 0}</span>
            <span className="stat-trend">Leads per day</span>
          </div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="panel">
        <div className="panel-header">
          <h3>Pipeline Status</h3>
          <span className="panel-subtitle">Leads by current status</span>
        </div>
        <div className="stats-grid">
          {Object.entries(stats.by_status || {}).map(([status, count]) => {
            const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0
            const timeInfo = timeMetrics[status]
            return (
              <div key={status} className="stat-card">
                <span className="stat-label">{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                <span className="stat-value">{count}</span>
                <span className="stat-trend">
                  {percentage}% of total
                  {timeInfo && ` · Avg ${timeInfo.avg_age_days} days old`}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Source Performance */}
      {Object.keys(sourcePerformance).length > 0 && (
        <div className="panel">
          <div className="panel-header">
            <h3>Source Performance</h3>
            <span className="panel-subtitle">Which channels drive results</span>
          </div>
          <div className="source-performance-table">
            <table>
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Total Leads</th>
                  <th>Qualified</th>
                  <th>Won</th>
                  <th>Qualified Rate</th>
                  <th>Win Rate</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(sourcePerformance).map(([source, data]) => (
                  <tr key={source}>
                    <td><strong>{source}</strong></td>
                    <td>{data.total}</td>
                    <td>{data.qualified}</td>
                    <td className={data.won > 0 ? 'success-cell' : ''}>{data.won}</td>
                    <td>{data.qualified_rate}%</td>
                    <td className={data.conversion_rate > 0 ? 'success-cell' : ''}>
                      {data.conversion_rate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Country Analytics */}
      {(countryAnalytics.top_source_countries || countryAnalytics.top_target_countries) && (
        <div className="panel">
          <div className="panel-header">
            <h3>Geographic Insights</h3>
            <span className="panel-subtitle">Top countries by volume</span>
          </div>
          <div className="country-analytics-grid">
            {countryAnalytics.top_source_countries && Object.keys(countryAnalytics.top_source_countries).length > 0 && (
              <div className="country-section">
                <h4>Top Source Countries</h4>
                <ul className="country-list">
                  {Object.entries(countryAnalytics.top_source_countries).map(([country, count]) => (
                    <li key={country}>
                      <span className="country-name">{country}</span>
                      <span className="country-count">{count} leads</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {countryAnalytics.top_target_countries && Object.keys(countryAnalytics.top_target_countries).length > 0 && (
              <div className="country-section">
                <h4>Top Target Countries</h4>
                <ul className="country-list">
                  {Object.entries(countryAnalytics.top_target_countries).map(([country, count]) => (
                    <li key={country}>
                      <span className="country-name">{country}</span>
                      <span className="country-count">{count} leads</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Leads */}
      {stats.recent && stats.recent.length > 0 && (
        <div className="panel">
          <div className="panel-header">
            <h3>Recent Leads</h3>
            <span className="panel-subtitle">Latest 10 submissions</span>
          </div>
          <div className="recent-list">
            <ul>
              {stats.recent.map((lead) => (
                <li key={lead.id}>
                  <div className="recent-lead-main">
                    <span className="recent-lead-name">{lead.name}</span>
                    <span className={`recent-lead-status status-${lead.status?.toLowerCase() || 'new'}`}>
                      {lead.status || 'new'}
                    </span>
                  </div>
                  <span className="recent-meta">
                    {lead.country} → {lead.target_country} · {lead.intake}
                    {lead.source && ` · via ${lead.source}`}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

// Individual page components using shared admin data
export function AdminLeadsPage() {
  const { token } = useAuth()
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [tableData, setTableData] = useState({ items: [], total_pages: 1 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [degreeFilter, setDegreeFilter] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [subjectOtherFilter, setSubjectOtherFilter] = useState('')

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {}

  const fetchTable = async (pageArg = page, overrides = {}, showLoading = true) => {
    const deg = overrides.degree !== undefined ? overrides.degree : degreeFilter
    const subj = overrides.subject !== undefined ? overrides.subject : subjectFilter
    const subjOther = overrides.subject_other !== undefined ? overrides.subject_other : subjectOtherFilter
    if (showLoading) {
      setLoading(true)
      setError('')
    }
    try {
      const params = new URLSearchParams({ page: String(pageArg), page_size: String(pageSize) })
      if (deg) params.set('degree', deg)
      if (subj) params.set('subject', subj)
      if (subj === 'Other' && subjOther && String(subjOther).trim()) {
        params.set('subject_other', String(subjOther).trim())
      }
      const res = await fetch(`${API_BASE}/v1/leads?${params}`, {
        headers: { ...authHeaders },
      })
      if (res.status === 401 || res.status === 403) {
        setError('Session expired or no access. Please log in again.')
        return
      }
      const data = await res.json()
      setTableData(data)
    } catch (err) {
      if (showLoading) {
        setError('Failed to load leads.')
      }
    } finally {
      if (showLoading) {
        setLoading(false)
      }
    }
  }

  const handleStatusChange = async (leadId, newStatus, version = null) => {
    return updateLeadStatus(leadId, newStatus, version, authHeaders, () => {
      fetchTable(page, {}, false)
    })
  }

  useEffect(() => {
    fetchTable(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handlePageChange = (newPage) => {
    setPage(newPage)
    fetchTable(newPage)
  }

  const handleDegreeFilter = (v) => {
    setDegreeFilter(v || '')
    setPage(1)
    fetchTable(1, { degree: v || '' })
  }

  const handleSubjectFilter = (v) => {
    setSubjectFilter(v || '')
    setSubjectOtherFilter('')
    setPage(1)
    fetchTable(1, { subject: v || '' })
  }

  const handleSubjectOtherFilterChange = (v) => {
    setSubjectOtherFilter(v)
    setPage(1)
    fetchTable(1, { subject: subjectFilter, subject_other: v })
  }

  const normalizedSearch = search.trim().toLowerCase()
  const filteredLeads = (tableData.items || []).filter((lead) => {
    if (!normalizedSearch) return true
    const haystack = [
      lead.name,
      lead.phone,
      lead.country,
      lead.target_country,
      lead.degree,
      lead.subject,
      lead.source,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return haystack.includes(normalizedSearch)
  })

  return (
    <div>
      <header className="admin-header">
        <h1>Leads</h1>
        <p>View and manage all study abroad leads.</p>
      </header>
      {error && <div className="admin-alert">{error}</div>}
      {loading && <div className="admin-loading">Loading leads...</div>}
      {!loading && (
        <LeadsTable
          leads={filteredLeads}
          page={tableData.page || page}
          totalPages={tableData.total_pages || 1}
          onPageChange={handlePageChange}
          onStatusChange={handleStatusChange}
          search={search}
          onSearchChange={setSearch}
          degreeFilter={degreeFilter || null}
          subjectFilter={subjectFilter || null}
          subjectOtherFilter={subjectOtherFilter}
          onDegreeFilterChange={handleDegreeFilter}
          onSubjectFilterChange={handleSubjectFilter}
          onSubjectOtherFilterChange={handleSubjectOtherFilterChange}
        />
      )}
    </div>
  )
}

export function AdminKanbanPage() {
  const { token } = useAuth()
  const [allLeads, setAllLeads] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {}

  const fetchLeads = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true)
      setError('')
    }
    try {
      const res = await fetch(`${API_BASE}/v1/leads?page=1&page_size=500`, {
        headers: { ...authHeaders },
      })
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Failed to load leads`)
      }
      const data = await res.json()
      setAllLeads(Array.isArray(data.items) ? data.items : [])
    } catch (err) {
      console.error('Error fetching leads:', err)
      if (showLoading) {
        setError(err.message || 'Failed to load leads')
      }
    } finally {
      if (showLoading) {
        setLoading(false)
      }
    }
  }

  const handleStatusChange = async (leadId, newStatus, version = null) => {
    return updateLeadStatus(leadId, newStatus, version, authHeaders, () => {
      fetchLeads(false)
    })
  }

  useEffect(() => {
    fetchLeads()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const normalizedSearch = search.trim().toLowerCase()
  const filteredLeads = allLeads.filter((lead) => {
    if (!normalizedSearch) return true
    const haystack = [
      lead.name,
      lead.phone,
      lead.country,
      lead.target_country,
      lead.degree,
      lead.subject,
      lead.source,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return haystack.includes(normalizedSearch)
  })

  return (
    <div>
      <header className="admin-header">
        <h1>Kanban Board</h1>
        <p>Drag and drop leads to change status.</p>
      </header>
      {error && <div className="admin-alert">{error}</div>}
      {loading && <div className="admin-loading">Loading leads...</div>}
      {!loading && (
        <>
          <div className="admin-search-row">
            <input
              type="text"
              className="admin-search-input"
              placeholder="Search leads in board..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <KanbanView allLeads={filteredLeads} onStatusChange={handleStatusChange} />
        </>
      )}
    </div>
  )
}

export function AdminStatsPage() {
  const { token } = useAuth()
  const [stats, setStats] = useState({ total: 0, by_status: {}, recent: [] })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {}

  const fetchStats = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/v1/leads/stats`, { headers: { ...authHeaders } })
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Failed to load stats`)
      }
      const data = await res.json()
      setStats(data || { total: 0, by_status: {}, recent: [] })
    } catch (err) {
      console.error('Error fetching stats:', err)
      setError(err.message || 'Failed to load stats')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div>
      <header className="admin-header">
        <h1>Statistics</h1>
        <p>Key performance indicators and analytics.</p>
      </header>
      {error && <div className="admin-alert">{error}</div>}
      {loading && <div className="admin-loading">Loading stats...</div>}
      {!loading && <StatsView stats={stats} />}
    </div>
  )
}

export function AdminProfilePage() {
  const { token, logout } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {}

  useEffect(() => {
    let mounted = true
    async function fetchMe() {
      setLoading(true)
      setError('')
      try {
        const res = await fetch(`${API_BASE}/auth/me`, { headers: { ...authHeaders } })
        if (res.status === 401 || res.status === 403) {
          setError('Session expired or no access. Please log in again.')
          return
        }
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.detail || 'Failed to load profile')
        }
        const data = await res.json()
        if (mounted) setProfile(data)
      } catch (err) {
        if (mounted) setError(err.message || 'Failed to load profile')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchMe()
    return () => { mounted = false }
  }, [token])

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.')
      return
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.')
      return
    }
    setPasswordLoading(true)
    try {
      const res = await fetch(`${API_BASE}/auth/me/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.status === 401) {
        setPasswordError(data.detail || 'Current password is incorrect.')
        return
      }
      if (!res.ok) {
        setPasswordError(data.detail || 'Failed to update password.')
        return
      }
      setPasswordSuccess('Password updated successfully.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setPasswordError(err.message || 'Failed to update password.')
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleDeleteOpen = () => {
    setDeleteConfirm('')
    setDeleteError('')
    setShowDeleteModal(true)
  }

  const handleDeleteClose = () => {
    setShowDeleteModal(false)
    setDeleteConfirm('')
    setDeleteError('')
  }

  const handleDeleteConfirm = async () => {
    if (deleteConfirm !== 'DELETE') return
    setDeleteError('')
    setDeleteLoading(true)
    try {
      const res = await fetch(`${API_BASE}/auth/me`, { method: 'DELETE', headers: { ...authHeaders } })
      if (res.status === 400) {
        const data = await res.json().catch(() => ({}))
        setDeleteError(data.detail || 'Cannot delete account.')
        return
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setDeleteError(data.detail || 'Failed to delete account.')
        return
      }
      logout()
      navigate('/admin/login')
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete account.')
    } finally {
      setDeleteLoading(false)
    }
  }

  const deleteConfirmValid = deleteConfirm === 'DELETE'

  return (
    <div>
      <header className="admin-header">
        <h1>Profile</h1>
        <p>Manage your account: change password or delete your profile.</p>
      </header>
      {error && <div className="admin-alert">{error}</div>}
      {loading && <div className="admin-loading">Loading profile...</div>}

      {!loading && profile && (
        <>
          <div className="panel">
            <div className="panel-header">
              <h3>Profile info</h3>
              <span className="panel-subtitle">Your account details</span>
            </div>
            <div className="profile-info">
              <div className="profile-info-row">
                <span className="profile-label">Email</span>
                <span className="profile-value">{profile.email}</span>
              </div>
              <div className="profile-info-row">
                <span className="profile-label">Full name</span>
                <span className="profile-value">{profile.full_name}</span>
              </div>
              <div className="profile-info-row">
                <span className="profile-label">Role</span>
                <span className="profile-value">{profile.role}</span>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h3>Change password</h3>
              <span className="panel-subtitle">Set a new password (min 8 characters)</span>
            </div>
            <form className="profile-form" onSubmit={handleChangePassword}>
              {passwordError && <div className="admin-alert">{passwordError}</div>}
              {passwordSuccess && <div className="profile-success">{passwordSuccess}</div>}
              <div className="profile-form-group">
                <label htmlFor="current-password">Current password</label>
                <input
                  id="current-password"
                  type="password"
                  className="admin-search-input"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              <div className="profile-form-group">
                <label htmlFor="new-password">New password</label>
                <input
                  id="new-password"
                  type="password"
                  className="admin-search-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <div className="profile-form-group">
                <label htmlFor="confirm-password">Confirm new password</label>
                <input
                  id="confirm-password"
                  type="password"
                  className="admin-search-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <button type="submit" className="nav-link" disabled={passwordLoading}>
                {passwordLoading ? 'Updating…' : 'Update password'}
              </button>
            </form>
          </div>

          <div className="panel profile-danger">
            <div className="panel-header">
              <h3>Delete account</h3>
              <span className="panel-subtitle">Permanently remove your account. This cannot be undone.</span>
            </div>
            <button type="button" className="logout-btn" onClick={handleDeleteOpen}>
              Delete my account
            </button>
          </div>
        </>
      )}

      {showDeleteModal && (
        <div className="profile-modal-overlay" onClick={handleDeleteClose}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete account</h3>
            <p>Type <strong>DELETE</strong> below to confirm. Your account will be permanently removed.</p>
            {deleteError && <div className="admin-alert">{deleteError}</div>}
            <input
              type="text"
              className="admin-search-input"
              placeholder="Type DELETE to confirm"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              autoComplete="off"
            />
            <div className="profile-modal-actions">
              <button type="button" className="nav-link" onClick={handleDeleteClose}>
                Cancel
              </button>
              <button
                type="button"
                className="logout-btn"
                onClick={handleDeleteConfirm}
                disabled={!deleteConfirmValid || deleteLoading}
              >
                {deleteLoading ? 'Deleting…' : 'Yes, delete my account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function AdminApprovalsPage() {
  const { token, role } = useAuth()
  const { decrementCount } = useContext(PendingCountContext)
  const [pendingUsers, setPendingUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {}

  const fetchPending = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/admin/pending-users`, { headers: { ...authHeaders } })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || 'Failed to load pending users')
      }
      const data = await res.json()
      setPendingUsers(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDecision = async (id, action) => {
    setError('')
    try {
      const url =
        action === 'approve'
          ? `${API_BASE}/admin/pending-users/${id}/approve`
          : `${API_BASE}/admin/pending-users/${id}/reject`
      const method = action === 'approve' ? 'POST' : 'DELETE'
      const res = await fetch(url, { method, headers: { ...authHeaders } })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || 'Action failed')
      }
      await fetchPending()
      decrementCount()
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    if (role === 'admin') {
      fetchPending()
      // lightweight polling so the list stays fresh without reloads
      const interval = setInterval(() => {
        if (document.visibilityState === 'visible') {
          fetchPending()
        }
      }, 15000) // 15s cadence
      return () => clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role])

  return (
    <div className="panel">
      <div className="panel-header">
        <h3>Approve Users</h3>
        <span className="panel-subtitle">Review pending signups and approve or reject.</span>
      </div>

      {error && <div className="admin-alert">{error}</div>}
      {loading && <div className="admin-loading">Loading pending users...</div>}

      {!loading && pendingUsers.length === 0 && (
        <div className="admin-loading">No pending users right now.</div>
      )}

      {!loading && pendingUsers.length > 0 && (
        <div className="table-wrapper">
          <table className="leads-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Requested</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingUsers.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.full_name}</td>
                  <td>{u.email}</td>
                  <td>{new Date(u.created_at).toLocaleString()}</td>
                  <td style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      className="nav-link"
                      style={{ padding: '0.35rem 0.65rem' }}
                      onClick={() => handleDecision(u.id, 'approve')}
                    >
                      Approve
                    </button>
                    <button
                      className="logout-btn"
                      style={{ padding: '0.35rem 0.65rem', marginTop: 0 }}
                      onClick={() => handleDecision(u.id, 'reject')}
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export function AdminUsersPage() {
  const { token, role } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {}

  const fetchUsers = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/admin/users`, { headers: { ...authHeaders } })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || 'Failed to load users')
      }
      const data = await res.json()
      setUsers(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (u) => {
    setError('')
    try {
      const res = await fetch(`${API_BASE}/admin/users/${u.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ is_active: !u.is_active }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || 'Action failed')
      }
      await fetchUsers()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDelete = async (u) => {
    if (!window.confirm(`Delete ${u.full_name} (${u.email})? They will not be able to sign in.`)) return
    setError('')
    try {
      const res = await fetch(`${API_BASE}/admin/users/${u.id}`, { method: 'DELETE', headers: { ...authHeaders } })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || 'Delete failed')
      }
      await fetchUsers()
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    if (role === 'admin') fetchUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role])

  if (role !== 'admin') return <Navigate to="/admin/dashboard" replace />

  return (
    <div>
      <header className="admin-header">
        <h1>Approved Users</h1>
        <p>Deactivate or delete approved users. Deactivated users cannot sign in until reactivated; deleted users are removed permanently.</p>
      </header>
      <div className="panel">
        <div className="panel-header">
          <h3>Users</h3>
          <span className="panel-subtitle">Manage approved staff accounts</span>
        </div>
        {error && <div className="admin-alert">{error}</div>}
        {loading && <div className="admin-loading">Loading users...</div>}
        {!loading && users.length === 0 && (
          <div className="admin-loading">No approved users.</div>
        )}
        {!loading && users.length > 0 && (
          <div className="table-wrapper">
            <table className="leads-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.full_name}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className={u.is_active ? 'status-pill status-new' : 'status-pill status-lost'}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{new Date(u.created_at).toLocaleString()}</td>
                    <td style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        className="nav-link"
                        style={{ padding: '0.35rem 0.65rem' }}
                        onClick={() => handleStatusChange(u)}
                      >
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        className="logout-btn"
                        style={{ padding: '0.35rem 0.65rem', marginTop: 0 }}
                        onClick={() => handleDelete(u)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// --- Pending (approve users) count: shared so ApprovalsPage can decrement on approve/reject
const PendingCountContext = createContext({ count: 0, decrementCount: () => {} })

function PendingCountProvider({ children }) {
  const { token, role } = useAuth()
  const [count, setCount] = useState(0)
  const [unchangedPolls, setUnchangedPolls] = useState(0)
  const mountedRef = useRef(true)
  const prevCountRef = useRef(undefined)
  const intervalMs = unchangedPolls >= 2 ? 30000 : 15000

  const fetchCount = useCallback(async () => {
    if (role !== 'admin') {
      setCount(0)
      return
    }
    try {
      const res = await fetch(`${API_BASE}/admin/pending-users/count`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) return
      const data = await res.json()
      const n = Number(data?.count || 0)
      if (mountedRef.current) {
        setCount(n)
        if (prevCountRef.current !== undefined && n === prevCountRef.current) {
          setUnchangedPolls((p) => p + 1)
        } else {
          setUnchangedPolls(0)
        }
        prevCountRef.current = n
      }
    } catch (_) {
      // silent
    }
  }, [token, role])

  const decrementCount = useCallback(() => {
    setCount((c) => Math.max(0, c - 1))
  }, [])

  useEffect(() => {
    mountedRef.current = true
    fetchCount()
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') fetchCount()
    }, intervalMs)
    return () => {
      mountedRef.current = false
      clearInterval(id)
    }
  }, [fetchCount, intervalMs])

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible') {
        setUnchangedPolls(0)
        fetchCount()
      }
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [fetchCount])

  return (
    <PendingCountContext.Provider value={{ count, decrementCount }}>
      {children}
    </PendingCountContext.Provider>
  )
}

// --- New leads count: track lastSeen when on Leads Table so we don't show badge when nothing new
const NewLeadsCountContext = createContext({
  newLeadsCount: 0,
  lastSeenNewCount: 0,
})

function NewLeadsCountProvider({ children }) {
  const { token } = useAuth()
  const location = useLocation()
  const locationRef = useRef(location.pathname)
  const [newLeadsCount, setNewLeadsCount] = useState(0)
  const [lastSeenNewCount, setLastSeenNewCount] = useState(0)
  const [unchangedPolls, setUnchangedPolls] = useState(0)
  const prevCountRef = useRef(undefined)
  const mountedRef = useRef(true)
  const intervalMs = unchangedPolls >= 2 ? 30000 : 15000

  useEffect(() => {
    locationRef.current = location.pathname
    // When user views Leads Table, mark current count as seen immediately
    if (location.pathname === '/admin/dashboard' || location.pathname === '/admin/dashboard/') {
      // Update lastSeenNewCount to current count so badge disappears
      setLastSeenNewCount(newLeadsCount)
    }
  }, [location.pathname, newLeadsCount])

  const fetchCount = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/v1/leads/new-count`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) return
      const data = await res.json()
      const n = Number(data?.count || 0)
      if (mountedRef.current) {
        setNewLeadsCount(n)
        const p = locationRef.current
        if (p === '/admin/dashboard' || p === '/admin/dashboard/') {
          setLastSeenNewCount(n)
        }
        if (prevCountRef.current !== undefined && n === prevCountRef.current) {
          setUnchangedPolls((x) => x + 1)
        } else {
          setUnchangedPolls(0)
        }
        prevCountRef.current = n
      }
    } catch (_) {
      // silent
    }
  }, [token])

  useEffect(() => {
    mountedRef.current = true
    fetchCount()
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') fetchCount()
    }, intervalMs)
    return () => {
      mountedRef.current = false
      clearInterval(id)
    }
  }, [fetchCount, intervalMs])

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible') {
        setUnchangedPolls(0)
        fetchCount()
      }
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [fetchCount])

  return (
    <NewLeadsCountContext.Provider value={{ newLeadsCount, lastSeenNewCount }}>
      {children}
    </NewLeadsCountContext.Provider>
  )
}

// Layout + nav only
export default function AdminDashboard() {
  const { token, role, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/admin/login')
  }

  // Session check: when user is deactivated or deleted, /auth/me returns 401. Redirect to login with the right error.
  useEffect(() => {
    if (!token) return
    const check = async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        if (res.status === 401 || res.status === 403) {
          const d = await res.json().catch(() => ({}))
          const msg = (d?.detail || '').toLowerCase()
          let err = 'session_expired'
          if (msg.includes('deactivated')) err = 'deactivated'
          else if (msg.includes('invalid username or password')) err = 'invalid_credentials'
          logout()
          navigate(`/admin/login?error=${err}`)
        }
      } catch (_) {}
    }
    const id = setInterval(check, 45000)
    check()
    return () => clearInterval(id)
  }, [token, logout, navigate])

  return (
    <PendingCountProvider>
      <NewLeadsCountProvider>
        <div className="admin-shell">
          <aside className="admin-sidebar">
        <div className="sidebar-logo">AllAbroad Admin</div>
        <nav className="sidebar-nav">
          <NavLink
            to="/admin/dashboard"
            end
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            <span className="nav-text-with-badge">Leads Table <NewLeadsBadge /></span>
          </NavLink>
          <NavLink
            to="/admin/dashboard/kanban"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            Kanban Board
          </NavLink>
          <NavLink
            to="/admin/dashboard/stats"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            Statistics
          </NavLink>
          {role === 'admin' && (
            <NavLink
              to="/admin/dashboard/approvals"
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              <span className="nav-text-with-badge">Approve Users <PendingBadge /></span>
            </NavLink>
          )}
          {role === 'admin' && (
            <NavLink
              to="/admin/dashboard/users"
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              Approved Users
            </NavLink>
          )}
        </nav>
        <div className="sidebar-bottom">
          <NavLink
            to="/admin/dashboard/profile"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            Profile
          </NavLink>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
    </div>
      </aside>
      <main className="admin-main">
        <div key={location.pathname} className="admin-main-content">
          <Outlet />
        </div>
      </main>
        </div>
      </NewLeadsCountProvider>
    </PendingCountProvider>
  )
}

// Badge: count of leads with status=new (for Leads Table nav). Only show when there are *new* leads since the user last viewed the Leads Table.
const NewLeadsBadge = React.memo(function NewLeadsBadge() {
  const location = useLocation()
  const { newLeadsCount, lastSeenNewCount } = useContext(NewLeadsCountContext)

  // Hide when viewing Leads Table — user has seen the list
  if (location.pathname === '/admin/dashboard' || location.pathname === '/admin/dashboard/') return null
  // Don't show when nothing new since last view (avoids showing stale count from polling when no change)
  if (newLeadsCount <= lastSeenNewCount || newLeadsCount <= 0) return null
  const display = newLeadsCount > 99 ? '99+' : String(newLeadsCount)
  return <span className="pending-badge" aria-label={`New leads: ${display}`}>{display}</span>
})

// Pending (approve users) badge: uses context so count decrements immediately on approve/reject
const PendingBadge = React.memo(function PendingBadge() {
  const { count } = useContext(PendingCountContext)
  if (!count || count <= 0) return null
  const display = count > 9 ? '9+' : String(count)
  return <span className="pending-badge" aria-label={`Pending approvals: ${display}`}>{display}</span>
})
