import { Plane } from "lucide-react"

/**
 * Animated plane that flies across the viewport. Use a wrapper so direction=left
 * (scaleX) does not conflict with the translateX keyframes.
 *
 * @param {string} [className] - Tailwind for position, e.g. "top-[14%] left-0 w-full"
 * @param {number} [delay=0] - animation-delay in seconds
 * @param {number} [duration=20] - animation duration in seconds
 * @param {number} [size=32] - Plane icon size
 * @param {"left"|"right"} [direction="right"] - right = left-to-right; left = right-to-left
 */
function FlyingPlane({ className = "", delay = 0, duration = 20, size = 32, direction = "right" }) {
  return (
    <div
      className={`absolute pointer-events-none ${className}`}
      style={{ transform: direction === "left" ? "scaleX(-1)" : undefined }}
    >
      <div
        style={{
          animation: `fly-across ${duration}s linear infinite`,
          animationDelay: `${delay}s`,
        }}
      >
        <Plane
          size={size}
          className="text-coral fill-coral/20 drop-shadow-lg"
          style={{ filter: "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))" }}
        />
      </div>
    </div>
  )
}

export default FlyingPlane
