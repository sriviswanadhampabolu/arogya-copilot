import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-plus-jakarta)", "sans-serif"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: {
          light: "rgba(255, 255, 255, 0.65)",
          dark: "rgba(15, 23, 42, 0.65)",
        },
        brand: {
          teal: "#14b8a6",
          sky: "#38bdf8",
          violet: "#8b5cf6",
        },
      },
      borderRadius: {
        "glass-sm": "16px",
        glass: "22px",
        "glass-lg": "28px",
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.08)",
        "glass-dark": "0 8px 32px 0 rgba(0, 0, 0, 0.4)",
        "glass-inner": "inset 0 1px 1px 0 rgba(255, 255, 255, 0.4)",
        "glow-teal": "0 0 25px -5px rgba(20, 184, 166, 0.4)",
      },
    },
  },
  plugins: [],
};
export default config;

