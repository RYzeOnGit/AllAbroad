import React, { useState, useEffect, useCallback } from "react"
import { Quote, Star, ChevronLeft, ChevronRight, GraduationCap } from "lucide-react"
import { useContent } from "../context/ContentContext"

const ANIMATION_MS = 500
const AUTO_ADVANCE_MS = 6000

const StudentStories = () => {
  const { content } = useContent()
  const testimonials = content?.testimonials ?? []

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  const safeIndex = Math.min(currentIndex, Math.max(0, testimonials.length - 1))
  const current = testimonials[safeIndex] ?? testimonials.find(Boolean)

  const next = useCallback(() => {
    if (testimonials.length === 0) return
    if (!isAnimating) {
      setIsAnimating(true)
      setCurrentIndex((prev) => (prev + 1) % testimonials.length)
    }
  }, [testimonials.length, isAnimating])

  const prev = useCallback(() => {
    if (testimonials.length === 0) return
    if (!isAnimating) {
      setIsAnimating(true)
      setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
    }
  }, [testimonials.length, isAnimating])

  const goTo = useCallback(
    (index) => {
      if (testimonials.length === 0 || index === safeIndex) return
      if (!isAnimating) {
        setIsAnimating(true)
        setCurrentIndex(index)
      }
    },
    [testimonials.length, safeIndex, isAnimating]
  )

  // Reset isAnimating after transition so the next card is visible
  useEffect(() => {
    if (!isAnimating) return
    const t = setTimeout(() => setIsAnimating(false), ANIMATION_MS)
    return () => clearTimeout(t)
  }, [currentIndex, isAnimating])

  // Auto-advance
  useEffect(() => {
    if (testimonials.length <= 1) return
    const id = setInterval(next, AUTO_ADVANCE_MS)
    return () => clearInterval(id)
  }, [testimonials.length, next])

  return (
    <section id="stories" className="py-24 bg-slate-900 text-white relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none" aria-hidden>
        <span className="absolute top-10 left-10 text-9xl opacity-5">✈️</span>
        <span className="absolute bottom-10 right-10 text-9xl opacity-5">🌍</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-coral font-semibold uppercase tracking-wider text-sm">
            Student Stories
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mt-4 text-white">
            Voices From <span className="text-coral">Around the World</span>
          </h2>
        </div>

        {/* Testimonial Card – all data from API (content.testimonials) */}
        <div className="max-w-4xl mx-auto">
          {testimonials.length === 0 || !current ? (
            <div className="rounded-3xl p-8 md:p-12 bg-white/5 border border-white/10 flex items-center justify-center min-h-[280px]">
              <p className="text-slate-500">No stories yet.</p>
            </div>
          ) : (
            <>
              <div
                className={`bg-white/10 backdrop-blur-sm rounded-3xl p-8 md:p-12 border border-white/10 transition-all duration-500 ${
                  isAnimating ? "opacity-0 scale-95" : "opacity-100 scale-100"
                }`}
              >
                <Quote className="w-12 h-12 text-coral/80 mb-6" aria-hidden />

                <blockquote className="text-xl md:text-2xl leading-relaxed mb-8 text-white/95">
                  &ldquo;{current.quote}&rdquo;
                </blockquote>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-coral/20 rounded-full flex items-center justify-center flex-shrink-0">
                      {current.image ? (
                        <span className="text-3xl" aria-hidden>{current.image}</span>
                      ) : (
                        <GraduationCap className="w-8 h-8 text-coral" aria-hidden />
                      )}
                    </div>
                    <div>
                      <p className="font-display text-lg font-semibold text-white">{current.name}</p>
                      <p className="text-white/70">{current.detail || ""}</p>
                    </div>
                  </div>

                  <div className="flex gap-0.5 flex-shrink-0">
                    {Array.from({ length: current.rating || 5 }).map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" aria-hidden />
                    ))}
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-center gap-4 mt-8">
                <button
                  type="button"
                  onClick={prev}
                  disabled={testimonials.length <= 1 || isAnimating}
                  className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors disabled:opacity-50 disabled:pointer-events-none text-white"
                  aria-label="Previous story"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="flex gap-2">
                  {testimonials.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => goTo(i)}
                      disabled={isAnimating}
                      className={`h-2 rounded-full transition-all duration-300 disabled:pointer-events-none ${
                        i === safeIndex
                          ? "w-8 bg-coral"
                          : "w-2 bg-white/30 hover:bg-white/50"
                      }`}
                      aria-label={`Go to story ${i + 1}`}
                      aria-current={i === safeIndex ? "true" : undefined}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={next}
                  disabled={testimonials.length <= 1 || isAnimating}
                  className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors disabled:opacity-50 disabled:pointer-events-none text-white"
                  aria-label="Next story"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}

export default StudentStories
