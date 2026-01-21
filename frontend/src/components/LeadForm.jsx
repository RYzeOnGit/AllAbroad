import React, { useState } from 'react'
import axios from 'axios'
import './LeadForm.css'

const LeadForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    country: '',
    target_country: '',
    intake: '',
    budget: '',
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

    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/aeef1879-87f6-4fbb-aee6-201e99f8a741',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'LeadForm.jsx:25',message:'handleSubmit called',data:{url:'/api/leads',formData:formData},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    try {
      const response = await axios.post('/api/leads', formData)
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
        budget: '',
        source: 'website'
      })
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/aeef1879-87f6-4fbb-aee6-201e99f8a741',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'LeadForm.jsx:46',message:'POST request failed',data:{errorMessage:error.message,status:error.response?.status,statusText:error.response?.statusText,data:error.response?.data,url:error.config?.url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      const errorMsg = error.response?.data?.detail || error.response?.statusText || error.message || 'Something went wrong. Please try again.'
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
              <label htmlFor="budget">Budget Range</label>
              <input
                type="text"
                id="budget"
                name="budget"
                value={formData.budget}
                onChange={handleChange}
                placeholder="$20,000 - $30,000"
              />
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

