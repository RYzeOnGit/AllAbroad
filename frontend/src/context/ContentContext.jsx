import React, { createContext, useContext, useEffect, useState } from "react"
import apiClient from "../api/client"

const emptyContent = {
  destinations: [],
  testimonials: [],
  why_us: [],
  cta_trust: [],
  hero_stats: [],
  copy: {},
}

const ContentContext = createContext({
  content: emptyContent,
  loading: true,
  error: null,
})

export function ContentProvider({ children }) {
  const [content, setContent] = useState(emptyContent)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!apiClient || typeof apiClient.get !== "function") {
      setLoading(false)
      return
    }
    setLoading(true)
    apiClient
      .get("/content")
      .then((res) => {
        setContent(res.data ?? emptyContent)
        setError(null)
      })
      .catch(() => {
        setContent(emptyContent)
      })
      .finally(() => setLoading(false))
  }, [])

  const value = {
    content: content ?? emptyContent,
    loading: !!loading,
    error,
  }

  return (
    <ContentContext.Provider value={value}>
      {children}
    </ContentContext.Provider>
  )
}

export function useContent() {
  const ctx = useContext(ContentContext)
  return ctx ?? { content: emptyContent, loading: false, error: null }
}
