import React from 'react'
import './Header.css'

const Header = () => {
  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">Study Abroad Experts</div>
        <nav className="nav">
          <a href="#about">About</a>
          <a href="#services">Services</a>
          <a href="#contact">Contact</a>
        </nav>
      </div>
    </header>
  )
}

export default Header

