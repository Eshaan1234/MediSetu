import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#050914",
        panel: "#0c1426",
        mint: "#34e2b0",
        sky: "#5eb8ff",
        lavender: "#a78bfa",
      },
      fontFamily: {
        sans: ["var(--font-ui)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(52,226,176,.16), 0 20px 70px -30px rgba(52,226,176,.45)",
      },
      keyframes: {
        float: {
          "0%,100%": { transform: "translate3d(0,0,0) scale(1)" },
          "50%": { transform: "translate3d(0,-22px,0) scale(1.05)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        pulseRing: {
          "0%": { transform: "scale(.7)", opacity: "0.7" },
          "100%": { transform: "scale(2.2)", opacity: "0" },
        },
      },
      animation: {
        float: "float 9s ease-in-out infinite",
        shimmer: "shimmer 2.4s linear infinite",
        pulseRing: "pulseRing 2.2s ease-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
