import React from "react"
import { Link } from "react-router-dom"
import { Plane, Check, FileDown } from "lucide-react"
import { useContent } from "../context/ContentContext"

const CtaBlock = () => {
  const { content } = useContent()
  const copy = content.copy || {}
  const raw = content.cta_trust ?? []
  const arr = Array.isArray(raw) ? raw : []
  const labels = arr.map((t) => (t && typeof t === 'object' && t.label) || (typeof t === 'string' ? t : '')).filter(Boolean)
  const displayTrust = labels.length ? labels : ["Free consultation", "No obligation", "98% visa success"]

  return (
    <section className="relative w-full py-16 md:py-24 overflow-hidden bg-gradient-to-r from-orange-50 via-amber-50 to-rose-100">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-coral/10 mb-6">
          <Plane className="w-7 h-7 text-coral" />
        </div>
        <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
          {copy.cta_heading ?? "Your Adventure Awaits"}
        </h2>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8">
          {copy.cta_description ?? "Get tailored program recommendations and expert guidance. Start with a free consultation—no strings attached."}
        </p>
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <Link
            to="/apply"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-coral text-white font-semibold hover:bg-coral/90 transition-colors"
          >
            Start Free Consultation
          </Link>
          <a
            href="#"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border-2 border-slate-300 text-foreground font-semibold hover:bg-white/80 hover:border-coral/50 transition-colors"
          >
            <FileDown className="w-4 h-4" />
            Download Guide
          </a>
        </div>
        <div className="flex flex-wrap justify-center gap-6 text-muted-foreground text-sm">
          {displayTrust.map((t) => (
            <span key={t} className="inline-flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-500" aria-hidden />
              {t}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

export default CtaBlock
