import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#FBF5EA",
        ink: "#20303A",
        coral: { DEFAULT: "#FF6B4A", soft: "#FFE3DB", deep: "#E04E2E" },
        teal: { DEFAULT: "#2D9C8F", soft: "#DBF0ED", deep: "#1F7A70" },
        sun: { DEFAULT: "#F5B12D", soft: "#FCEFD2" },
        night: { DEFAULT: "#15222B", card: "#1E2F3A", line: "#2C4250" },
      },
      borderRadius: { xl2: "1.25rem" },
      boxShadow: {
        card: "0 2px 10px rgba(32,48,58,0.07)",
        pop: "0 6px 0 rgba(32,48,58,0.12)",
      },
      keyframes: {
        pop: { "0%": { transform: "scale(0.9)" }, "60%": { transform: "scale(1.04)" }, "100%": { transform: "scale(1)" } },
        rise: { "0%": { opacity: "0", transform: "translateY(10px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
      },
      animation: { pop: "pop .25s ease-out", rise: "rise .3s ease-out both" },
    },
  },
  plugins: [],
};
export default config;
