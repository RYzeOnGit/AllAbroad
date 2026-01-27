import React, { useState } from 'react'
import axios from 'axios'
import { DEGREES, SUBJECTS, CURRENCIES } from '../constants/leadOptions'
import './LeadForm.css'

const LeadForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    country: '',
    target_country: '',
    intake: '',
    degree: '',
    subject: '',
    subject_other: '',
    budget_min: '',
    budget_max: '',
    budget_currency: 'USD',
    source: 'website'
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    if (formData.subject === 'Other' && !formData.subject_other.trim()) {
      setMessage({ type: 'error', text: 'Please specify your subject when choosing Other.' })
      setLoading(false)
      return
    }
    const minVal = formData.budget_min === '' ? null : Math.floor(Number(formData.budget_min))
    const maxVal = formData.budget_max === '' ? null : Math.floor(Number(formData.budget_max))
    if (minVal == null && maxVal == null) {
      setMessage({ type: 'error', text: 'Please enter at least a minimum or maximum tuition amount.' })
      setLoading(false)
      return
    }
    if (minVal != null && (minVal < 0 || !Number.isInteger(minVal))) {
      setMessage({ type: 'error', text: 'Minimum tuition must be a whole number (e.g. 20000).' })
      setLoading(false)
      return
    }
    if (maxVal != null && (maxVal < 0 || !Number.isInteger(maxVal))) {
      setMessage({ type: 'error', text: 'Maximum tuition must be a whole number (e.g. 30000).' })
      setLoading(false)
      return
    }
    if (minVal != null && maxVal != null && minVal > maxVal) {
      setMessage({ type: 'error', text: 'Minimum cannot be greater than maximum.' })
      setLoading(false)
      return
    }

    const payload = {
      name: formData.name,
      phone: formData.phone,
      country: formData.country,
      target_country: formData.target_country,
      intake: formData.intake,
      degree: formData.degree,
      subject: formData.subject,
      ...(formData.subject === 'Other' ? { subject_other: formData.subject_other.trim() } : {}),
      ...(minVal != null ? { budget_min: minVal } : {}),
      ...(maxVal != null ? { budget_max: maxVal } : {}),
      budget_currency: formData.budget_currency,
      source: formData.source
    }

    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/aeef1879-87f6-4fbb-aee6-201e99f8a741',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'LeadForm.jsx:25',message:'handleSubmit called',data:{url:'/api/leads',formData:payload},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    try {
      const response = await axios.post('/api/leads', payload)
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/aeef1879-87f6-4fbb-aee6-201e99f8a741',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'LeadForm.jsx:31',message:'POST request succeeded',data:{status:response.status,statusText:response.statusText},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      setMessage({ 
        type: 'success', 
        text: 'Thank you! We\'ll be in touch soon.' 
      })
      // Reset form
      setFormData({
        name: '',
        phone: '',
        country: '',
        target_country: '',
        intake: '',
        degree: '',
        subject: '',
        subject_other: '',
        budget_min: '',
        budget_max: '',
        budget_currency: 'USD',
        source: 'website'
      })
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/aeef1879-87f6-4fbb-aee6-201e99f8a741',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'LeadForm.jsx:46',message:'POST request failed',data:{errorMessage:error.message,status:error.response?.status,statusText:error.response?.statusText,data:error.response?.data,url:error.config?.url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      let errorMsg = error.response?.data?.detail || error.response?.statusText || error.message || 'Something went wrong. Please try again.'
      if (Array.isArray(errorMsg)) {
        errorMsg = errorMsg.map((e) => (e?.msg != null ? e.msg : e?.detail != null ? e.detail : String(e))).join(' ')
      } else if (errorMsg && typeof errorMsg === 'object') {
        errorMsg = errorMsg.msg || errorMsg.detail || 'Something went wrong. Please try again.'
      }
      if (/degree/i.test(String(errorMsg))) {
        errorMsg = "We currently only support Bachelor's and Master's programs. PhD, Diploma, and other degrees are coming soon. Thank you for your patience."
      }
      setMessage({ 
        type: 'error', 
        text: errorMsg 
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="contact" className="lead-form-section">
      <div className="lead-form-container">
        <h2 className="form-title">Start Your Study Abroad Journey</h2>
        <p className="form-subtitle">Fill out the form below and we'll get back to you within 24 hours</p>
        
        <form className="lead-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Full Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="John Doe"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="phone">Phone Number *</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                placeholder="+1 (123) 456-7890"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="country">Current Country *</label>
              <input
                type="text"
                id="country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                required
                placeholder="USA"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="target_country">Target Country *</label>
              <input
                type="text"
                id="target_country"
                name="target_country"
                value={formData.target_country}
                onChange={handleChange}
                required
                placeholder="UK"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="intake">Intake Period *</label>
              <input
                type="text"
                id="intake"
                name="intake"
                value={formData.intake}
                onChange={handleChange}
                required
                placeholder="Fall 2024"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="degree">Degree *</label>
              <p className="form-hint">We currently support Bachelor's and Master's only. PhD, Diploma, and other options are coming soon.</p>
              <select
                id="degree"
                name="degree"
                value={formData.degree}
                onChange={handleChange}
                required
              >
                <option value="">Select degree</option>
                {DEGREES.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="subject">Subject *</label>
              <select
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
              >
                <option value="">Select subject</option>
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            {formData.subject === 'Other' && (
              <div className="form-group">
                <label htmlFor="subject_other">Specify subject *</label>
                <input
                  type="text"
                  id="subject_other"
                  name="subject_other"
                  value={formData.subject_other}
                  onChange={handleChange}
                  placeholder="e.g. Data Science"
                />
              </div>
            )}
          </div>

          <div className="form-row">
            <div className="form-group form-group-full">
              <label>Tuition budget range (preferred currency) *</label>
              <p className="form-hint">We ask for tuition fees only, not total living or travel expenses. Enter a range, e.g. 20,000 – 30,000. At least one of min or max is required.</p>
              <div className="form-inline form-inline-range">
                <input
                  type="number"
                  id="budget_min"
                  name="budget_min"
                  value={formData.budget_min}
                  onChange={handleChange}
                  min={0}
                  step={1}
                  placeholder="Min (e.g. 20000)"
                />
                <span className="form-range-sep">–</span>
                <input
                  type="number"
                  id="budget_max"
                  name="budget_max"
                  value={formData.budget_max}
                  onChange={handleChange}
                  min={0}
                  step={1}
                  placeholder="Max (e.g. 30000)"
                />
                <select
                  id="budget_currency"
                  name="budget_currency"
                  value={formData.budget_currency}
                  onChange={handleChange}
                  required
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {message.text && (
            <div className={`form-message ${message.type}`}>
              {message.text}
            </div>
          )}

          <button 
            type="submit" 
            className="submit-btn"
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit Application'}
          </button>
        </form>
      </div>
    </section>
  )
}

export default LeadForm

