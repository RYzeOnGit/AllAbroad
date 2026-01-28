import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

const root = document.getElementById('root')
root.innerHTML = '<p style="padding:2rem;text-align:center;color:#64748b">Loading…</p>'

import('./App').then((mod) => {
  const App = mod.default
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}).catch((e) => {
  root.innerHTML =
    '<pre style="padding:20px;color:#b91c1c;white-space:pre-wrap;font:14px monospace">App failed to load:\n' +
    (e?.message || String(e)) +
    '\n\n' +
    (e?.stack || '') +
    '</pre>'
  console.error('App load error', e)
})

