import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        border: "hsl(214 18% 88%)",
        input: "hsl(214 18% 88%)",
        ring: "hsl(158 64% 28%)",
        background: "hsl(210 20% 97%)",
        foreground: "hsl(215 30% 10%)",
        primary: {
          DEFAULT: "hsl(158 64% 28%)",
          foreground: "hsl(0 0% 100%)",
        },
        secondary: {
          DEFAULT: "hsl(160 20% 93%)",
          foreground: "hsl(215 30% 10%)",
        },
        destructive: {
          DEFAULT: "hsl(0 72% 51%)",
          foreground: "hsl(0 0% 100%)",
        },
        muted: {
          DEFAULT: "hsl(210 18% 94%)",
          foreground: "hsl(215 16% 44%)",
        },
        accent: {
          DEFAULT: "hsl(162 55% 32%)",
          foreground: "hsl(0 0% 100%)",
        },
        popover: {
          DEFAULT: "hsl(0 0% 100%)",
          foreground: "hsl(215 30% 10%)",
        },
        card: {
          DEFAULT: "hsl(0 0% 100%)",
          foreground: "hsl(215 30% 10%)",
        },
        warning: {
          DEFAULT: "hsl(38 92% 50%)",
          foreground: "hsl(0 0% 100%)",
        },
        sidebar: {
          DEFAULT: "hsl(210 40% 8%)",
          foreground: "hsl(200 20% 88%)",
          primary: "hsl(158 64% 42%)",
          "primary-foreground": "hsl(0 0% 100%)",
          accent: "hsl(210 35% 14%)",
          "accent-foreground": "hsl(200 20% 88%)",
          border: "hsl(210 30% 14%)",
          ring: "hsl(158 64% 42%)",
        },
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.375rem",
      },
      backgroundImage: {
        "tech-grid":
          "linear-gradient(hsl(214 18% 88% / 0.5) 1px, transparent 1px), linear-gradient(90deg, hsl(214 18% 88% / 0.5) 1px, transparent 1px)",
        "emerald-glow":
          "radial-gradient(ellipse at 0% 0%, hsl(158 64% 28% / 0.06) 0%, transparent 60%)",
        "card-shine":
          "linear-gradient(135deg, hsl(0 0% 100% / 0.8) 0%, hsl(0 0% 100% / 0.4) 100%)",
      },
      backgroundSize: {
        "grid-32": "32px 32px",
      },
      boxShadow: {
        card: "0 1px 4px 0 hsl(215 30% 10% / 0.06), 0 1px 2px -1px hsl(215 30% 10% / 0.04)",
        "card-hover": "0 6px 20px -4px hsl(158 64% 28% / 0.15), 0 2px 8px -2px hsl(215 30% 10% / 0.06)",
        glow: "0 0 20px hsl(158 64% 28% / 0.25)",
        "glow-sm": "0 0 10px hsl(158 64% 28% / 0.15)",
        "inner-glow": "inset 0 0 12px hsl(158 64% 28% / 0.05)",
        techy: "0 4px 24px -4px hsl(158 64% 28% / 0.2), 0 1px 4px hsl(215 30% 10% / 0.05)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 8px hsl(158 64% 28% / 0.2)" },
          "50%": { boxShadow: "0 0 24px hsl(158 64% 28% / 0.5)" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        "pulse-ring": {
          "0%, 100%": { opacity: "0.5", transform: "scale(1)" },
          "50%": { opacity: "0", transform: "scale(2.5)" },
        },
        "scan": {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "10%": { opacity: "1" },
          "90%": { opacity: "1" },
          "100%": { transform: "translateY(100px)", opacity: "0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.4s ease-out forwards",
        "slide-up": "slide-up 0.5s ease-out forwards",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        shimmer: "shimmer 1.5s ease-in-out infinite",
        "pulse-ring": "pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        scan: "scan 3s ease-in-out infinite",
        float: "float 3s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;