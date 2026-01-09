import React from 'react'
import Header from './components/Header'
import Hero from './components/Hero'
import About from './components/About'
import LeadForm from './components/LeadForm'
import Footer from './components/Footer'
import './App.css'

function App() {
  return (
    <div className="App">
      <Header />
      <Hero />
      <About />
      <LeadForm />
      <Footer />
    </div>
  )
}

export default App

