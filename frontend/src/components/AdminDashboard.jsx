import React, { useEffect, useState, createContext, useContext } from 'react'
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
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import './AdminDashboard.css'

const API_BASE = '/api'

// Simple context removed - each page is now independent

function StatusPill({ status }) {
  const label = status || 'unknown'
  return <span className={`status-pill status-${label.toLowerCase()}`}>{label}</span>
}

function LeadsTable({ leads, page, totalPages, onPageChange, onStatusChange, search, onSearchChange }) {
  return (
    <div className="panel">
      <div className="panel-header">
        <h3>Leads</h3>
        <span className="panel-subtitle">Paginated list of all leads</span>
      </div>
      <div className="admin-search-row">
        <input
          type="text"
          className="admin-search-input"
          placeholder="Search by name, phone, country, target country, or source..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
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
              <th>Budget</th>
              <th>Source</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '1.5rem' }}>
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
                <td>{lead.budget || '—'}</td>
                <td>{lead.source}</td>
                <td>
                  <select
                    className="status-select"
                    value={lead.status || 'new'}
                    onChange={(e) => onStatusChange(lead.id, e.target.value)}
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
        <div className="kanban-row meta">
          <span>{lead.source}</span>
          <span>{lead.budget || '—'}</span>
        </div>
      </div>
      <div className="kanban-card-footer" onClick={(e) => e.stopPropagation()}>
        <select
          className="status-select small"
          value={lead.status || 'new'}
          onChange={(e) => {
            e.stopPropagation()
            onStatusChange(lead.id, e.target.value)
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

function KanbanColumn({ title, statusKey, leads, onStatusChange }) {
  // Fallback for non-drag version (keeping for compatibility)
  return (
    <div className="kanban-column">
      <div className="kanban-column-header">
        <h4>{title}</h4>
        <span className="kanban-count">{leads.length}</span>
      </div>
      <div className="kanban-column-body">
        {leads.length === 0 && <div className="kanban-empty">No leads</div>}
        {leads.map((lead) => (
          <div key={lead.id} className="kanban-card">
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
              <div className="kanban-row meta">
                <span>{lead.source}</span>
                <span>{lead.budget || '—'}</span>
              </div>
            </div>
            <div className="kanban-card-footer">
              <select
                className="status-select small"
                value={lead.status || 'new'}
                onChange={(e) => onStatusChange(lead.id, e.target.value)}
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
              </select>
            </div>
          </div>
        ))}
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

  // Initialize items from allLeads
  useEffect(() => {
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
        distance: 8, // Require 8px of movement before dragging starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event) => {
    setActiveId(event.active.id)
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeId = active.id.toString()
    const overId = over.id.toString()

    // Extract lead ID from active
    const leadIdMatch = activeId.match(/^lead-(\d+)$/)
    if (!leadIdMatch) return

    const leadId = parseInt(leadIdMatch[1])

    // Check if dropping on a column
    const columnMatch = overId.match(/^column-(.+)$/)
    if (columnMatch) {
      const newStatus = columnMatch[1]
      // Find current status to avoid unnecessary API calls
      let currentStatus = null
      for (const [statusKey, leads] of Object.entries(items)) {
        if (leads.some((l) => l.id === leadId)) {
          currentStatus = statusKey
          break
        }
      }
      // Only update if status changed
      if (currentStatus && currentStatus !== newStatus) {
        onStatusChange(leadId, newStatus)
      }
      return
    }

    // If dropping on another card, find which column it's in
    const overLeadMatch = overId.match(/^lead-(\d+)$/)
    if (overLeadMatch) {
      // Find the column this lead belongs to
      for (const [statusKey, leads] of Object.entries(items)) {
        if (leads.some((l) => l.id === parseInt(overLeadMatch[1]))) {
          const newStatus = statusKey
          // Find current status
          let currentStatus = null
          for (const [sk, ls] of Object.entries(items)) {
            if (ls.some((l) => l.id === leadId)) {
              currentStatus = sk
              break
            }
          }
          // Only update if status changed
          if (currentStatus && currentStatus !== newStatus) {
            onStatusChange(leadId, newStatus)
          }
          return
        }
      }
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

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {}

  const fetchTable = async (pageArg = page) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/v1/leads?page=${pageArg}&page_size=${pageSize}`, {
        headers: { ...authHeaders },
      })
      if (res.status === 401 || res.status === 403) {
        setError('Session expired or no access. Please log in again.')
        return
      }
      const data = await res.json()
      setTableData(data)
    } catch (err) {
      setError('Failed to load leads.')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (leadId, newStatus) => {
    try {
      await fetch(`${API_BASE}/v1/leads/${leadId}/status?new_status=${encodeURIComponent(newStatus)}`, {
        method: 'PATCH',
        headers: { ...authHeaders },
      })
      fetchTable(page)
    } catch {
      setError('Failed to update lead status.')
    }
  }

  useEffect(() => {
    fetchTable(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handlePageChange = (newPage) => {
    setPage(newPage)
    fetchTable(newPage)
  }

  const normalizedSearch = search.trim().toLowerCase()
  const filteredLeads = (tableData.items || []).filter((lead) => {
    if (!normalizedSearch) return true
    const haystack = [
      lead.name,
      lead.phone,
      lead.country,
      lead.target_country,
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

  const fetchLeads = async () => {
    setLoading(true)
    setError('')
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
      setError(err.message || 'Failed to load leads')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (leadId, newStatus) => {
    try {
      await fetch(`${API_BASE}/v1/leads/${leadId}/status?new_status=${encodeURIComponent(newStatus)}`, {
        method: 'PATCH',
        headers: { ...authHeaders },
      })
      fetchLeads()
    } catch {
      setError('Failed to update lead status.')
    }
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

// Layout + nav only
export default function AdminDashboard() {
  const { token, role, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/admin/login')
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="sidebar-logo">AllAbroad Admin</div>
        <nav className="sidebar-nav">
          <NavLink
            to="/admin/dashboard"
            end
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            Leads Table
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
        <Outlet />
      </main>
    </div>
  )
}

// Memoized badge component with lightweight polling and isolated state
const PendingBadge = React.memo(function PendingBadge() {
  const { token, role } = useAuth()
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (role !== 'admin') return
    let mounted = true
    let controller = null

    const fetchCount = async () => {
      try {
        controller = new AbortController()
        const res = await fetch(`${API_BASE}/admin/pending-users/count`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          signal: controller.signal,
        })
        if (!res.ok) return
        const data = await res.json()
        if (mounted) setCount(Number(data?.count || 0))
      } catch (_) {
        // silent failure to avoid UI noise
      }
    }

    fetchCount()
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchCount()
      }
    }, 15000) // 15s cadence for spontaneous updates

    return () => {
      mounted = false
      if (controller) controller.abort()
      clearInterval(interval)
    }
  }, [token, role])

  if (!count || count <= 0) return null
  const display = count > 10 ? '10+' : String(count)
  return <span className="pending-badge" aria-label={`Pending approvals: ${display}`}>{display}</span>
})
