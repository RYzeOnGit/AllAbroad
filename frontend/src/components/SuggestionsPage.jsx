import React, { useMemo, useState } from 'react'
import './SuggestionsPage.css'

const API_BASE = 'http://localhost:8000/api'

const COUNTRIES = ['UK', 'USA', 'Canada', 'Germany', 'Australia']
const DEGREE_LEVELS = [
  { value: '', label: 'Any' },
  { value: 'bachelor', label: 'Bachelor' },
  { value: 'master', label: 'Master' },
  { value: 'phd', label: 'PhD' },
]

function formatMoney(n) {
  if (n == null) return '—'
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
  } catch {
    return `$${n}`
  }
}

function Chip({ children }) {
  return <span className="chip">{children}</span>
}

function UniversityCard({ uni, selected, onToggleSelect }) {
  return (
    <div className={`uni-card ${selected ? 'selected' : ''}`}>
      <div className="uni-card-header">
        <div className="uni-title">
          <h3>{uni.name}</h3>
          <p className="uni-meta">{uni.city}, {uni.country}</p>
        </div>
        <button className="uni-select-btn" onClick={() => onToggleSelect(uni)}>
          {selected ? 'Remove' : 'Shortlist'}
        </button>
      </div>

      <div className="uni-badges">
        {uni.ranking_band && <Chip>{uni.ranking_band.replaceAll('_', ' ')}</Chip>}
        {uni.fees_per_year_usd_est != null && <Chip>{formatMoney(uni.fees_per_year_usd_est)}/yr</Chip>}
        {uni.highlights?.slice(0, 2).map((h) => <Chip key={h}>{h}</Chip>)}
      </div>

      <div className="uni-why">
        <h4>Why this is a good fit</h4>
        <ul>
          {(uni.why || []).slice(0, 5).map((w, idx) => (
            <li key={idx}>{w}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function CompareDrawer({ selected, onRemove, onClear }) {
  if (selected.length === 0) return null
  return (
    <div className="compare-drawer">
      <div className="compare-header">
        <div>
          <strong>Comparison</strong>
          <span className="compare-sub">({selected.length} selected)</span>
        </div>
        <button className="compare-clear" onClick={onClear}>Clear</button>
      </div>
      <div className="compare-grid">
        {selected.map((u) => (
          <div key={u.id} className="compare-card">
            <div className="compare-card-top">
              <div>
                <div className="compare-name">{u.name}</div>
                <div className="compare-meta">{u.city}, {u.country}</div>
              </div>
              <button className="compare-remove" onClick={() => onRemove(u.id)}>×</button>
            </div>
            <div className="compare-row">
              <span>Est. tuition</span>
              <span>{u.fees_per_year_usd_est != null ? `${formatMoney(u.fees_per_year_usd_est)}/yr` : '—'}</span>
            </div>
            <div className="compare-row">
              <span>Ranking</span>
              <span>{u.ranking_band ? u.ranking_band.replaceAll('_', ' ') : '—'}</span>
            </div>
            <div className="compare-row">
              <span>Highlights</span>
              <span className="compare-highlights">{(u.highlights || []).slice(0, 2).join(' · ') || '—'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function SuggestionsPage() {
  const [targetCountry, setTargetCountry] = useState('UK')
  const [degreeLevel, setDegreeLevel] = useState('')
  const [subject, setSubject] = useState('')
  const [budget, setBudget] = useState('')
  const [language, setLanguage] = useState('English')
  const [includeAlternatives, setIncludeAlternatives] = useState(true)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [results, setResults] = useState({ suggestions: [], alternatives: [] })

  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('shortlist') || '[]')
    } catch {
      return []
    }
  })

  const selectedIds = useMemo(() => new Set(selected.map((s) => s.id)), [selected])

  const filteredResults = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return results
    const filterList = (list) =>
      (list || []).filter((u) => {
        const hay = [u.name, u.country, u.city, u.ranking_band, ...(u.highlights || [])]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return hay.includes(q)
      })
    return {
      suggestions: filterList(results.suggestions),
      alternatives: filterList(results.alternatives),
    }
  }, [results, search])

  const toggleSelect = (uni) => {
    setSelected((prev) => {
      const exists = prev.some((p) => p.id === uni.id)
      const next = exists ? prev.filter((p) => p.id !== uni.id) : [...prev, uni]
      localStorage.setItem('shortlist', JSON.stringify(next))
      return next
    })
  }

  const removeSelected = (id) => {
    setSelected((prev) => {
      const next = prev.filter((p) => p.id !== id)
      localStorage.setItem('shortlist', JSON.stringify(next))
      return next
    })
  }

  const clearSelected = () => {
    localStorage.setItem('shortlist', '[]')
    setSelected([])
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload = {
        target_country: targetCountry,
        degree_level: degreeLevel || null,
        subject: subject.trim() || null,
        budget_usd_per_year: budget ? Number(budget) : null,
        language: language.trim() || null,
        include_alternatives: includeAlternatives,
        max_results: 8,
      }
      const res = await fetch(`${API_BASE}/suggestions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `HTTP ${res.status}`)
      }
      const data = await res.json()
      setResults({ suggestions: data.suggestions || [], alternatives: data.alternatives || [] })
    } catch (err) {
      setError(err.message || 'Failed to get suggestions')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="suggestions-page">
      <div className="suggestions-hero">
        <div className="suggestions-hero-inner">
          <h1>Discover Universities</h1>
          <p>Choose a target country (and optionally subject/budget). We’ll suggest universities — plus stronger alternatives you might not have considered.</p>
        </div>
      </div>

      <div className="suggestions-container">
        <form className="suggestions-form" onSubmit={onSubmit}>
          <div className="form-grid">
            <div className="field">
              <label>Target country</label>
              <select value={targetCountry} onChange={(e) => setTargetCountry(e.target.value)}>
                {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Degree level</label>
              <select value={degreeLevel} onChange={(e) => setDegreeLevel(e.target.value)}>
                {DEGREE_LEVELS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Subject</label>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Computer Science" />
            </div>
            <div className="field">
              <label>Budget (USD / year)</label>
              <input value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="e.g. 30000" inputMode="numeric" />
            </div>
            <div className="field">
              <label>Language</label>
              <input value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="e.g. English" />
            </div>
            <div className="field toggle">
              <label>Include alternatives</label>
              <div className="toggle-row">
                <input
                  id="alts"
                  type="checkbox"
                  checked={includeAlternatives}
                  onChange={(e) => setIncludeAlternatives(e.target.checked)}
                />
                <label htmlFor="alts" className="toggle-label">Show “better feature” alternatives</label>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button className="primary" type="submit" disabled={loading}>
              {loading ? 'Generating…' : 'Get suggestions'}
            </button>
            <input
              className="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search results…"
            />
          </div>

          {error && <div className="error">{error}</div>}
        </form>

        <div className="results">
          <div className="results-section">
            <div className="results-header">
              <h2>Suggested in {targetCountry}</h2>
              <span className="results-count">{filteredResults.suggestions.length} results</span>
            </div>
            <div className="cards-grid">
              {filteredResults.suggestions.map((u) => (
                <UniversityCard key={u.id} uni={u} selected={selectedIds.has(u.id)} onToggleSelect={toggleSelect} />
              ))}
              {filteredResults.suggestions.length === 0 && (
                <div className="empty">No matches. Try a different subject/budget, or clear search.</div>
              )}
            </div>
          </div>

          {includeAlternatives && (
            <div className="results-section">
              <div className="results-header">
                <h2>Alternatives with strong features</h2>
                <span className="results-count">{filteredResults.alternatives.length} results</span>
              </div>
              <div className="cards-grid">
                {filteredResults.alternatives.map((u) => (
                  <UniversityCard key={u.id} uni={u} selected={selectedIds.has(u.id)} onToggleSelect={toggleSelect} />
                ))}
                {filteredResults.alternatives.length === 0 && (
                  <div className="empty">No alternatives found yet.</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <CompareDrawer
        selected={selected}
        onRemove={removeSelected}
        onClear={clearSelected}
      />
    </div>
  )
}


