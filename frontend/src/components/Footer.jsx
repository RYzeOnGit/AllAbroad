import React from "react"
import { Link } from "react-router-dom"
import { Plane, Facebook, Instagram, Linkedin } from "lucide-react"

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="inline-flex items-center gap-2 text-white mb-4">
              <Plane className="w-6 h-6 text-coral" aria-hidden />
              <span className="font-display font-bold text-xl">AllAbroad</span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              Turning study abroad dreams into life-changing adventures. Join thousands of students who&apos;ve discovered their global path with AllAbroad.
            </p>
            <div className="flex gap-3 mt-4">
              <a href="#" className="text-slate-400 hover:text-coral transition-colors" aria-label="Facebook">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-coral transition-colors" aria-label="Instagram">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-coral transition-colors" aria-label="LinkedIn">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Explore */}
          <div>
            <h4 className="font-semibold text-white mb-4">Explore</h4>
            <ul className="space-y-2">
              <li><a href="#destinations" className="text-slate-400 hover:text-coral transition-colors">Destinations</a></li>
              <li><a href="#destinations" className="text-slate-400 hover:text-coral transition-colors">Programs</a></li>
              <li><Link to="/apply" className="text-slate-400 hover:text-coral transition-colors">Apply</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-2">
              <li><a href="#about" className="text-slate-400 hover:text-coral transition-colors">About</a></li>
              <li><a href="#stories" className="text-slate-400 hover:text-coral transition-colors">Stories</a></li>
              <li><a href="#" className="text-slate-400 hover:text-coral transition-colors">Careers</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-white mb-4">Support</h4>
            <ul className="space-y-2">
              <li><Link to="/apply" className="text-slate-400 hover:text-coral transition-colors">Contact</Link></li>
              <li><a href="#" className="text-slate-400 hover:text-coral transition-colors">FAQ</a></li>
              <li><a href="#" className="text-slate-400 hover:text-coral transition-colors">Privacy Policy</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-slate-700/60 text-center text-slate-500 text-sm">
          © {new Date().getFullYear()} AllAbroad. All rights reserved.
        </div>
      </div>
    </footer>
  )
}

export default Footer
