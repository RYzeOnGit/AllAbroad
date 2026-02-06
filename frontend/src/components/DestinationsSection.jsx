import React, { useState } from "react"
import { ArrowUpRight } from "lucide-react"
import { useContent } from "../context/ContentContext"

const GRADIENTS_BY_CODE = {
  GB: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
  AU: "linear-gradient(135deg, #f4a261 0%, #e76f51 100%)",
  CA: "linear-gradient(135deg, #d62828 0%, #003049 100%)",
  DE: "linear-gradient(135deg, #2d3436 0%, #636e72 100%)",
  US: "linear-gradient(135deg, #3c3b6e 0%, #1a1a2e 100%)",
  NZ: "linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)",
}
const DEFAULT_GRADIENT = "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)"

const DestinationsSection = () => {
  const { content, loading } = useContent()
  const destinations = content.destinations || []
  const [hoveredId, setHoveredId] = useState(null)

  const list = loading && destinations.length === 0 ? [] : destinations

  return (
    <section id="destinations" className="py-16 md:py-24 bg-slate-50 relative overflow-hidden">
      {/* Background decoration – matches WhyUs / light-section vibe */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-coral/5 rounded-full blur-3xl -translate-y-1/2" aria-hidden />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="max-w-2xl mb-12 md:mb-16">
          <span className="text-coral font-semibold uppercase tracking-wider text-sm">
            Destinations
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mt-3 mb-4 text-foreground">
            Where Will Your
            <span className="text-gradient"> Story Unfold?</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            From historic European cities to vibrant Asian metropolises, find the
            perfect backdrop for your academic adventure.
          </p>
        </div>

        {/* Destinations Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {list.map((d, index) => {
            const gradient = GRADIENTS_BY_CODE[d.country_code] ?? DEFAULT_GRADIENT
            const id = d.id ?? d.country
            const programCount = Array.isArray(d.programs) ? d.programs.length : 0
            return (
              <div
                key={id}
                className="group relative rounded-2xl md:rounded-3xl overflow-hidden cursor-default transform transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl block"
                onMouseEnter={() => setHoveredId(id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* Background – gradient with hover scale */}
                <div
                  className="absolute inset-0 transition-transform duration-700 group-hover:scale-110"
                  style={{ background: gradient }}
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-foreground/40 group-hover:bg-foreground/30 transition-colors duration-500" />

                {/* Content */}
                <div className="relative p-6 md:p-8 h-64 md:h-72 flex flex-col justify-between text-white">
                  <div className="flex justify-between items-start">
                    <span className="text-4xl md:text-5xl" aria-hidden>{d.flag}</span>
                    <div
                      className={`w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center transition-all duration-500 ${
                        hoveredId === id
                          ? "translate-x-0 translate-y-0 opacity-100"
                          : "translate-x-1 translate-y-1 opacity-0"
                      }`}
                    >
                      <ArrowUpRight className="w-5 h-5 text-white" />
                    </div>
                  </div>

                  <div>
                    <h3 className="font-display text-xl md:text-2xl font-bold mb-2 text-white">
                      {d.country}
                    </h3>
                    <p className="text-white/80 text-sm mb-3">
                      {(Array.isArray(d.cities) ? d.cities : []).join(" • ") || "—"}
                    </p>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-sm">
                      <span className="font-semibold text-white">{programCount}</span>
                      <span className="text-white/80">Programs</span>
                    </div>
                  </div>
                </div>

                {/* Animated border on hover */}
                <div
                  className={`absolute inset-0 border-2 border-white/30 rounded-2xl md:rounded-3xl pointer-events-none transition-opacity duration-500 ${
                    hoveredId === id ? "opacity-100" : "opacity-0"
                  }`}
                />
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default DestinationsSection
