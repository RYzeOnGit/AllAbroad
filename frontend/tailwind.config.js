/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        coral: "#f97316",
        background: "#ffffff",
        foreground: "#0f172a",
        "muted-foreground": "#64748b",
        secondary: "#e2e8f0",
        card: "#ffffff",
        muted: "#f1f5f9",
        border: "#e2e8f0",
      },
      fontFamily: {
        display: ["Georgia", "Playfair Display", "serif"],
      },
      backgroundImage: {
        "gradient-hero": "linear-gradient(180deg, #f0f9ff 0%, #ffffff 55%, #fff7ed 100%)",
        "gradient-sunset": "linear-gradient(135deg, #f97316 0%, #ea580c 40%, #c2410c 100%)",
      },
      animation: {
        drift: "drift 18s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
        "fade-up": "fade-up 0.6s ease-out forwards",
      },
    },
  },
  plugins: [],
}
