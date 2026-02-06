import { useEffect, useState, useRef } from "react"

/**
 * Wraps children and applies a parallax translateY on scroll.
 * @param {React.ReactNode} children
 * @param {number} [speed=0.5]
 * @param {string} [className=""]
 */
function ParallaxSection({ children, speed = 0.5, className = "" }) {
  const [offset, setOffset] = useState(0)
  const sectionRef = useRef(null)

  useEffect(() => {
    const handleScroll = () => {
      if (sectionRef.current) {
        const scrolled = window.scrollY
        const rate = scrolled * speed
        setOffset(rate)
      }
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [speed])

  return (
    <div ref={sectionRef} className={`relative overflow-hidden ${className}`}>
      <div
        style={{
          transform: `translateY(${offset}px)`,
          transition: "transform 0.1s ease-out",
        }}
      >
        {children}
      </div>
    </div>
  )
}

export default ParallaxSection
