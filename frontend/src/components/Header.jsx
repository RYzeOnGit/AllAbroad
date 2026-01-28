import React, { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Plane, Menu, X } from "lucide-react"

const navLinks = [
  { href: "/#destinations", label: "Destinations" },
  { href: "/#destinations", label: "Programs" },
  { href: "/#about", label: "About" },
  { href: "/#stories", label: "Stories" },
]

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? "bg-white shadow-md border-b border-slate-200/60 py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-foreground hover:text-coral transition-colors group">
            <Plane className="w-7 h-7 text-coral transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
            <span className="font-display font-bold text-xl">AllAbroad</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8" aria-label="Main">
            {navLinks.map(({ href, label }) => (
              <a
                key={label}
                href={href}
                className="relative font-medium text-foreground/80 hover:text-coral transition-colors duration-300 group"
              >
                {label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-coral transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <Link
              to="/admin/login"
              className="text-foreground/80 hover:text-coral transition-colors hidden sm:inline"
            >
              Sign In
            </Link>
            <Link
              to="/apply"
              className="hidden md:inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-coral text-white font-medium hover:bg-coral/90 transition-colors"
            >
              Start Your Journey
            </Link>
            <button
              type="button"
              className="md:hidden p-2 text-foreground hover:text-coral"
              onClick={() => setMobileOpen((o) => !o)}
              aria-expanded={mobileOpen}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden py-4 border-t border-slate-200/80 bg-background/95 backdrop-blur-lg animate-fade-up">
            <nav className="flex flex-col gap-1" aria-label="Mobile">
              {navLinks.map(({ href, label }) => (
                <a
                  key={label}
                  href={href}
                  className="py-2 text-foreground/80 hover:text-coral"
                  onClick={() => setMobileOpen(false)}
                >
                  {label}
                </a>
              ))}
              <Link to="/admin/login" className="py-2 text-foreground/80 hover:text-coral" onClick={() => setMobileOpen(false)}>
                Sign In
              </Link>
              <Link
                to="/apply"
                className="mt-2 inline-flex justify-center py-2.5 rounded-lg bg-coral text-white font-medium"
                onClick={() => setMobileOpen(false)}
              >
                Start Your Journey
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header
