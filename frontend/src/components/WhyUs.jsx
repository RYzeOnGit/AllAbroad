import React from "react"
import { Link } from "react-router-dom"
import * as Lucide from "lucide-react"
import { useContent } from "../context/ContentContext"

const WhyUs = () => {
  const { content } = useContent()
  const cards = content.why_us || []
  return (
    <section id="about" className="py-16 md:py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-coral font-semibold text-sm uppercase tracking-wider mb-2">Why AllAbroad?</p>
        <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
          We&apos;re Not Your <span className="text-gradient">Typical</span> Agency
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl mb-12">
          Forget the cookie-cutter approach. We&apos;re dreamers, travelers, and educators who believe studying abroad should be as exciting as the destination itself.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-14">
          {cards.map((c) => {
            const Icon = (typeof c.icon === "string" && Lucide[c.icon])
              ? Lucide[c.icon]
              : function FallbackIcon({ className }) { return <span className={className} aria-hidden /> }
            return (
            <div
              key={c.id ?? c.title}
              className="p-6 rounded-xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:border-coral/30 transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-coral/10 flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-coral" />
              </div>
              <h3 className="font-display font-bold text-lg text-foreground mb-2">{c.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{c.text}</p>
            </div>
          );
          })}
        </div>
        <div className="flex justify-center">
          <Link
            to="/apply"
            className="inline-flex items-center px-6 py-3 rounded-lg bg-coral text-white font-medium hover:bg-coral/90 transition-colors"
          >
            Register Here
          </Link>
        </div>
      </div>
    </section>
  )
}

export default WhyUs
