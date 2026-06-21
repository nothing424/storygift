/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        parchment: {
          DEFAULT: "#F7F1E6",
          dim: "#EFE6D4",
        },
        ink: {
          DEFAULT: "#1C1810",
          soft: "#2A241A",
          faint: "#6B6354",
        },
        rosegold: {
          DEFAULT: "#C97B63",
          light: "#E0A48F",
          dark: "#A35F49",
        },
        teal: {
          DEFAULT: "#2D4A4A",
          light: "#3F6363",
          dark: "#1B2F2F",
        },
        gold: {
          DEFAULT: "#D4AF6A",
          light: "#E5CC9A",
        },
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jbmono)", "monospace"],
      },
      boxShadow: {
        spine: "inset 6px 0 12px -8px rgba(0,0,0,0.35)",
        book: "0 8px 24px -8px rgba(28,24,16,0.25), 0 2px 6px -2px rgba(28,24,16,0.15)",
        "book-dark": "0 8px 24px -8px rgba(0,0,0,0.55), 0 2px 6px -2px rgba(0,0,0,0.4)",
      },
      borderRadius: {
        book: "0.5rem 0.75rem 0.75rem 0.5rem",
      },
      keyframes: {
        pageturn: {
          "0%": { transform: "rotateY(8deg) translateX(6px)", opacity: "0" },
          "100%": { transform: "rotateY(0deg) translateX(0)", opacity: "1" },
        },
        fadeup: {
          "0%": { transform: "translateY(8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        pageturn: "pageturn 0.45s cubic-bezier(0.22,1,0.36,1)",
        fadeup: "fadeup 0.5s cubic-bezier(0.22,1,0.36,1)",
      },
    },
  },
  plugins: [],
};
