import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── ADRIAN Emergency Design Tokens ───────────────────
        er: {
          red:           "#D32F2F",
          "red-dark":    "#B71C1C",
          "red-light":   "#FFEBEE",
          "red-mid":     "#EF5350",
          orange:        "#F57C00",
          "orange-light":"#FFF3E0",
          "orange-mid":  "#FF9800",
          green:         "#2E7D32",
          "green-light": "#E8F5E9",
          "green-mid":   "#43A047",
          blue:          "#1565C0",
          "blue-light":  "#E3F2FD",
          "blue-mid":    "#1976D2",
          yellow:        "#F9A825",
          "yellow-light":"#FFFDE7",
        },
        // ── Neutral Surfaces ─────────────────────────────────
        em: {
          bg:      "#F5F6FA",
          white:   "#FFFFFF",
          subtle:  "#EEF0F6",
          muted:   "#E5E8F0",
          border:  "#D1D5DB",
          "border-strong": "#9CA3AF",
          text:         "#0D1B2A",
          "text-dim":   "#374151",
          "text-muted": "#6B7280",
          "text-disabled":"#9CA3AF",
        },
        // ── Keep legacy nova tokens as aliases for backwards compat ──
        nova: {
          bg:           "#F5F6FA",
          surface:      "#FFFFFF",
          surface2:     "#EEF0F6",
          border:       "#D1D5DB",
          border2:      "#9CA3AF",
          cyan:         "#1565C0",   // repurposed to Emergency Blue
          "cyan-dim":   "#1976D2",
          blue:         "#1565C0",
          "blue-bright":"#1976D2",
          critical:     "#D32F2F",
          "critical-dim":"#B71C1C",
          high:         "#F57C00",
          medium:       "#F9A825",
          low:          "#2E7D32",
          text:         "#0D1B2A",
          "text-dim":   "#374151",
          "text-muted": "#6B7280",
        },
        // ── shadcn tokens ─────────────────────────────────────
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      fontFamily: {
        sans:    ["Inter", "system-ui", "sans-serif"],
        mono:    ["JetBrains Mono", "Fira Code", "monospace"],
        display: ["Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        // Enforce 16px minimum for all body text
        "body-sm": ["15px", { lineHeight: "1.5" }],
        "body":    ["16px", { lineHeight: "1.6" }],
        "body-lg": ["18px", { lineHeight: "1.6" }],
      },
      spacing: {
        "tap": "48px",   // Minimum 48px tap target
        "tap-lg": "56px",
      },
      backgroundImage: {
        "em-gradient":   "linear-gradient(135deg, #F5F6FA 0%, #FFFFFF 50%, #F5F6FA 100%)",
        "red-glow":      "radial-gradient(ellipse at center, rgba(211,47,47,0.12) 0%, transparent 70%)",
        "blue-glow":     "radial-gradient(ellipse at center, rgba(21,101,192,0.10) 0%, transparent 70%)",
        "hero-pattern":  "linear-gradient(rgba(21,101,192,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(21,101,192,0.04) 1px, transparent 1px)",
      },
      backgroundSize: {
        "grid-48": "48px 48px",
      },
      boxShadow: {
        "em-sm":       "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)",
        "em-md":       "0 4px 12px rgba(0,0,0,0.10), 0 2px 4px rgba(0,0,0,0.06)",
        "em-lg":       "0 10px 28px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.08)",
        "em-xl":       "0 20px 48px rgba(0,0,0,0.15)",
        "em-red":      "0 6px 20px rgba(211,47,47,0.30)",
        "em-blue":     "0 6px 20px rgba(21,101,192,0.25)",
        "em-green":    "0 6px 20px rgba(46,125,50,0.25)",
        // Legacy aliases
        "nova":        "0 0 0 1px rgba(0,0,0,0.06), 0 4px 24px rgba(0,0,0,0.10)",
        "nova-card":   "0 1px 3px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.08)",
        "nova-critical":"0 6px 20px rgba(211,47,47,0.30)",
        "glow-sm":     "0 2px 8px rgba(21,101,192,0.20)",
        "glow-md":     "0 4px 16px rgba(21,101,192,0.20)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      animation: {
        "pulse-slow":     "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "ping-slow":      "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite",
        "spin-slow":      "spin 3s linear infinite",
        "fade-up":        "fade-up 0.35s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "sos-pulse":      "sos-ring 1.8s ease-out infinite",
        "status-pulse":   "status-pulse 1.5s ease-in-out infinite",
        "ticker":         "ticker-scroll 40s linear infinite",
        "skeleton":       "skeleton-shimmer 1.5s infinite",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(20px)" },
          to:   { opacity: "1", transform: "translateX(0)" },
        },
        "sos-ring": {
          "0%":   { boxShadow: "0 0 0 0 rgba(211,47,47,0.6)" },
          "70%":  { boxShadow: "0 0 0 20px rgba(211,47,47,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(211,47,47,0)" },
        },
        "status-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.5" },
        },
        "ticker-scroll": {
          "0%":   { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "skeleton-shimmer": {
          "0%":   { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
