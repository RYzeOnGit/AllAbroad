import React from "react"
import { Link } from "react-router-dom"
import { Globe, ArrowRight, MapPin } from "lucide-react"
import FlyingPlane from "./FlyingPlane"
import ParallaxSection from "./ParallaxSection"
import { useContent } from "../context/ContentContext"

const Hero = () => {
  const { content, loading } = useContent()
  const copy = content?.copy ?? {}
  const stats = content?.hero_stats ?? []
  const fallbackStats = [
    { value: "100+", label: "Students" },
    { value: "98%", label: "Visa Success" },
    { value: "4.9", label: "Rating" },
  ]
  const baseStats = stats.length ? stats : fallbackStats
  const displayStats = baseStats.map((s, index) =>
    index === 0 ? { ...s, value: "100+", label: "Students" } : s
  )

  return (
    <section className="relative min-h-screen bg-gradient-hero overflow-hidden">
      {/* Animated planes */}
      <FlyingPlane className="top-[15%] left-0 w-full" direction="right" delay={0} size={40} duration={20} />
      <FlyingPlane className="top-[35%] left-0 w-full" direction="left" delay={7} size={28} duration={20} />
      <FlyingPlane className="top-[55%] left-0 w-full" direction="right" delay={12} size={36} duration={20} />

      {/* Decorative blurs */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-coral/10 rounded-full blur-3xl animate-drift" aria-hidden />
      <div className="absolute bottom-40 left-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-drift animation-delay-400" aria-hidden />

      {/* Cloud shapes */}
      <ParallaxSection speed={0.2} className="absolute inset-0 pointer-events-none">
        <div className="absolute top-32 left-[10%] w-40 h-16 bg-background/40 rounded-full blur-xl" />
        <div className="absolute top-48 left-[15%] w-24 h-10 bg-background/30 rounded-full blur-lg" />
        <div className="absolute top-24 right-[20%] w-56 h-20 bg-background/40 rounded-full blur-xl" />
        <div className="absolute top-40 right-[25%] w-32 h-12 bg-background/30 rounded-full blur-lg" />
      </ParallaxSection>

      {/* Main content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 md:pt-32 pb-16 md:pb-20 min-h-screen flex items-center">
        <div className="grid lg:grid-cols-2 gap-12 items-center w-full">
          {/* Left column – text */}
          <div className="space-y-6 md:space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-coral/10 rounded-full text-coral font-medium text-sm animate-fade-up">
              <MapPin size={16} aria-hidden />
              <span>Hitting Those Top 150 Universities!</span>
            </div>

            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight animate-fade-up animation-delay-200">
              {copy.hero_headline_1 ?? "Your Next Chapter"}
              <span className="block text-gradient">{copy.hero_headline_2 ?? "Starts Abroad"}</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-lg animate-fade-up animation-delay-400">
              {copy.hero_description ?? "We don't just help you study abroad—we help you discover who you become when the whole world is your classroom."}
            </p>

            <div className="flex flex-wrap gap-4 animate-fade-up animation-delay-600">
              <a
                href="#destinations"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-coral text-white font-semibold hover:bg-coral/90 transition-colors group"
              >
                Explore Programs
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
              </a>
            </div>

            {/* Stats */}
            <div className="flex gap-6 md:gap-8 pt-4 md:pt-8 animate-fade-up animation-delay-800">
              {displayStats.map((s) => (
                <div key={s.id ?? s.label} className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-coral">{s.value}</div>
                  <div className="text-sm text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right column – visual */}
          <ParallaxSection speed={0.1} className="relative hidden lg:block">
            <div className="relative">
              {/* Main card */}
              <div className="relative z-10 bg-card rounded-3xl p-8 shadow-2xl transform rotate-2 hover:rotate-0 transition-transform duration-500 border border-white/60">
                <div className="aspect-[4/3] bg-gradient-sunset rounded-2xl flex items-center justify-center overflow-hidden">
                  <div className="text-center text-white p-6">
                    <div className="text-6xl mb-4" aria-hidden>🌍</div>
                    <h3 className="font-display text-2xl font-bold mb-2">
                      {loading ? "…" : (copy.hero_card_title ?? "Ready for Adventure?")}
                    </h3>
                    <p className="text-white/90">Your journey awaits</p>
                  </div>
                </div>
                <div className="mt-6 flex items-center gap-4">
                  <div className="flex -space-x-3">
                    {["😊", "🎓", "✨", "🌟"].map((emoji, i) => (
                      <div
                        key={i}
                        className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-lg border-2 border-card"
                        aria-hidden
                      >
                        {emoji}
                      </div>
                    ))}
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold text-foreground">500+ students</span>
                    <span className="text-muted-foreground"> joined this month</span>
                  </div>
                </div>
              </div>

              {/* Floating cards */}
              <div className="absolute -top-6 -left-6 bg-card rounded-2xl p-4 shadow-xl animate-float z-20 border border-slate-200/80">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center text-2xl" aria-hidden>🇬🇧</div>
                  <div>
                    <div className="font-semibold text-foreground">London, UK</div>
                    <div className="text-sm text-muted-foreground">12 Programs</div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-4 -right-4 bg-card rounded-2xl p-4 shadow-xl animate-float animation-delay-400 z-20 border border-slate-200/80">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-coral/20 rounded-xl flex items-center justify-center text-2xl" aria-hidden>🇦🇺</div>
                  <div>
                    <div className="font-semibold text-foreground">Sydney, AU</div>
                    <div className="text-sm text-muted-foreground">8 Programs</div>
                  </div>
                </div>
              </div>
            </div>
          </ParallaxSection>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
        <span className="text-sm text-muted-foreground">Scroll to explore</span>
        <div className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex justify-center pt-2">
          <div className="w-1.5 h-3 bg-coral rounded-full" aria-hidden />
        </div>
      </div>
    </section>
  )
}

export default Hero
