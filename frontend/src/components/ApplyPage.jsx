import React from "react"
import { Link } from "react-router-dom"
import { FileText, ArrowLeft } from "lucide-react"
import Header from "./Header"
import Footer from "./Footer"
import LeadForm from "./LeadForm"

const ApplyPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-sky-100/60 via-white to-amber-50/60">
      <Header />
      <main className="flex-1">
        {/* Page header */}
        <div className="bg-gradient-to-b from-white/95 to-slate-50/60 border-b border-slate-200/80">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 md:pt-24 pb-8 md:pb-10">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-coral text-sm font-medium mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to home
            </Link>
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 rounded-xl bg-coral/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-coral" />
              </div>
              <div>
                <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                  Start Your Application
                </h1>
                <p className="text-muted-foreground mt-0.5">
                  Share your study abroad goals and we’ll get back to you within 24 hours.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form – extra bottom padding to avoid abrupt cut above footer */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 pb-12 md:pb-16">
          <LeadForm />
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default ApplyPage
