import React from 'react'
import './About.css'

const About = () => {
  return (
    <section id="about" className="about">
      <div className="about-container">
        <div className="about-header">
          <h2 className="about-main-title">Our Journey Begins</h2>
        </div>
        <div className="about-content">
          <div className="about-text">
            <h3 className="about-title">Who We Are</h3>
            <p className="about-description">
              At Study Abroad Experts, we specialize in guiding students through their study abroad journeys, 
              assisting with visa applications and university placements. Our experienced team offers personalized 
              support covering scholarships, student life, housing, and more. We strive to make the international 
              education experience seamless and enriching, ensuring students are well-prepared for their adventures. 
              Your aspirations are our priority, and together, we can turn them into reality.
            </p>
            <button className="read-more-btn">Read More</button>
          </div>
          <div className="about-image">
            <div className="image-placeholder">
              <svg viewBox="0 0 400 500" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="400" height="500" fill="#E8E8E8"/>
                <circle cx="200" cy="180" r="60" fill="#D0D0D0"/>
                <rect x="140" y="260" width="120" height="200" fill="#D0D0D0"/>
                <text x="200" y="300" textAnchor="middle" fill="#999" fontSize="16" fontFamily="Arial">
                  Student Photo
                </text>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default About

