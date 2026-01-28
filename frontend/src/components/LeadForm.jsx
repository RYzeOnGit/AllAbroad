import React, { useState } from "react"
import apiClient from "../api/client"
import { DEGREES, SUBJECTS, CURRENCIES } from "../constants/leadOptions"

const SectionLabel = ({ children }) => (
  <p className="text-coral font-semibold text-xs uppercase tracking-wider mb-4 mt-6 first:mt-0">
    {children}
  </p>
)

const LeadForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    country: "",
    target_country: "",
    intake: "",
    degree: "",
    subject: "",
    subject_other: "",
    budget_min: "",
    budget_max: "",
    budget_currency: "USD",
    source: "website",
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: "", text: "" })

    if (formData.subject === "Other" && !formData.subject_other.trim()) {
      setMessage({ type: "error", text: "Please specify your subject when choosing Other." })
      setLoading(false)
      return
    }
    const minVal = formData.budget_min === "" ? null : Math.floor(Number(formData.budget_min))
    const maxVal = formData.budget_max === "" ? null : Math.floor(Number(formData.budget_max))
    if (minVal == null && maxVal == null) {
      setMessage({ type: "error", text: "Please enter at least a minimum or maximum tuition amount." })
      setLoading(false)
      return
    }
    if (minVal != null && (minVal < 0 || !Number.isInteger(minVal))) {
      setMessage({ type: "error", text: "Minimum tuition must be a whole number (e.g. 20000)." })
      setLoading(false)
      return
    }
    if (maxVal != null && (maxVal < 0 || !Number.isInteger(maxVal))) {
      setMessage({ type: "error", text: "Maximum tuition must be a whole number (e.g. 30000)." })
      setLoading(false)
      return
    }
    if (minVal != null && maxVal != null && minVal > maxVal) {
      setMessage({ type: "error", text: "Minimum cannot be greater than maximum." })
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
      ...(formData.subject === "Other" ? { subject_other: formData.subject_other.trim() } : {}),
      ...(minVal != null ? { budget_min: minVal } : {}),
      ...(maxVal != null ? { budget_max: maxVal } : {}),
      budget_currency: formData.budget_currency,
      source: formData.source,
    }

    try {
      await apiClient.post("/leads", payload)
      setMessage({ type: "success", text: "Thank you! We'll be in touch soon." })
      setFormData({
        name: "",
        phone: "",
        country: "",
        target_country: "",
        intake: "",
        degree: "",
        subject: "",
        subject_other: "",
        budget_min: "",
        budget_max: "",
        budget_currency: "USD",
        source: "website",
      })
    } catch (error) {
      let errorMsg =
        error.response?.data?.detail || error.response?.statusText || error.message || "Something went wrong. Please try again."
      if (Array.isArray(errorMsg)) {
        errorMsg = errorMsg.map((e) => (e?.msg != null ? e.msg : e?.detail != null ? e.detail : String(e))).join(" ")
      } else if (errorMsg && typeof errorMsg === "object") {
        errorMsg = errorMsg.msg || errorMsg.detail || "Something went wrong. Please try again."
      }
      if (/degree/i.test(String(errorMsg))) {
        errorMsg =
          "We currently only support Bachelor's and Master's programs. PhD, Diploma, and other degrees are coming soon. Thank you for your patience."
      }
      setMessage({ type: "error", text: errorMsg })
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    "w-full px-4 py-3 rounded-lg border-2 border-slate-200 bg-white text-foreground placeholder:text-slate-400 focus:border-coral focus:ring-2 focus:ring-coral/20 focus:outline-none transition"
  const labelClass = "block font-medium text-foreground text-sm mb-1.5"
  const hintClass = "text-sm text-muted-foreground mt-1 mb-2"
  const selectClass = inputClass + " cursor-pointer pr-10"

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200/80 overflow-hidden">
      <form onSubmit={handleSubmit} className="px-6 md:px-8 pt-6 md:pt-8 pb-10 md:pb-12">
        <SectionLabel>Contact details</SectionLabel>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className={labelClass}>Full Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="John Doe"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="phone" className={labelClass}>Phone Number *</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              placeholder="+1 (123) 456-7890"
              className={inputClass}
            />
          </div>
        </div>

        <SectionLabel>Location</SectionLabel>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="country" className={labelClass}>Current Country *</label>
            <input
              type="text"
              id="country"
              name="country"
              value={formData.country}
              onChange={handleChange}
              required
              placeholder="e.g. USA"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="target_country" className={labelClass}>Target Country *</label>
            <input
              type="text"
              id="target_country"
              name="target_country"
              value={formData.target_country}
              onChange={handleChange}
              required
              placeholder="e.g. UK"
              className={inputClass}
            />
          </div>
        </div>

        <SectionLabel>Study plans</SectionLabel>
        <div className="grid sm:grid-cols-2 gap-4 items-start">
          <div>
            <label htmlFor="intake" className={labelClass}>Intake Period *</label>
            <input
              type="text"
              id="intake"
              name="intake"
              value={formData.intake}
              onChange={handleChange}
              required
              placeholder="e.g. Fall 2025"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="degree" className={labelClass}>Degree *</label>
            <select
              id="degree"
              name="degree"
              value={formData.degree}
              onChange={handleChange}
              required
              className={selectClass}
            >
              <option value="">Select degree</option>
              {DEGREES.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <p className="text-sm text-muted-foreground mt-1.5">Bachelor&apos;s and Master&apos;s only. Other levels coming soon.</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mt-4 items-start">
          <div>
            <label htmlFor="subject" className={labelClass}>Subject *</label>
            <select
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              className={selectClass}
            >
              <option value="">Select subject</option>
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          {formData.subject === "Other" && (
            <div>
              <label htmlFor="subject_other" className={labelClass}>Specify subject *</label>
              <input
                type="text"
                id="subject_other"
                name="subject_other"
                value={formData.subject_other}
                onChange={handleChange}
                placeholder="e.g. Data Science"
                className={inputClass}
              />
            </div>
          )}
        </div>

        <SectionLabel>Budget</SectionLabel>
        <div>
          <label className={labelClass}>Tuition budget range (preferred currency) *</label>
          <p className={hintClass}>Tuition fees only. Enter min and/or max; at least one required.</p>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="number"
              id="budget_min"
              name="budget_min"
              value={formData.budget_min}
              onChange={handleChange}
              min={0}
              step={1}
              placeholder="Min (e.g. 20000)"
              className={`${inputClass} flex-1 min-w-[140px] max-w-[180px]`}
            />
            <span className="text-muted-foreground font-medium">–</span>
            <input
              type="number"
              id="budget_max"
              name="budget_max"
              value={formData.budget_max}
              onChange={handleChange}
              min={0}
              step={1}
              placeholder="Max (e.g. 30000)"
              className={`${inputClass} flex-1 min-w-[140px] max-w-[180px]`}
            />
            <select
              id="budget_currency"
              name="budget_currency"
              value={formData.budget_currency}
              onChange={handleChange}
              required
              className={`${selectClass} w-auto min-w-[100px]`}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {message.text && (
          <div
            className={`mt-6 p-4 rounded-lg font-medium ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full py-3.5 px-6 rounded-lg bg-coral text-white font-semibold hover:bg-coral/90 focus:ring-2 focus:ring-coral/30 focus:ring-offset-2 focus:outline-none transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Submitting..." : "Submit Application"}
        </button>
      </form>
    </div>
  )
}

export default LeadForm
