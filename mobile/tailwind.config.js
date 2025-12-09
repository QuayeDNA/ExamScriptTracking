/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Design System Colors - matching web
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        success: {
          50: "oklch(0.98 0.02 150)",
          100: "oklch(0.95 0.04 150)",
          500: "oklch(0.65 0.22 145)",
          600: "oklch(0.55 0.22 145)",
          700: "oklch(0.48 0.2 145)",
          900: "oklch(0.35 0.15 145)",
          DEFAULT: "oklch(0.65 0.22 145)",
        },
        warning: {
          50: "oklch(0.98 0.02 85)",
          100: "oklch(0.95 0.05 85)",
          500: "oklch(0.72 0.18 70)",
          600: "oklch(0.62 0.18 60)",
          700: "oklch(0.52 0.16 55)",
          900: "oklch(0.38 0.12 50)",
          DEFAULT: "oklch(0.72 0.18 70)",
        },
        error: {
          50: "oklch(0.98 0.02 25)",
          100: "oklch(0.96 0.04 25)",
          500: "oklch(0.62 0.25 25)",
          600: "oklch(0.55 0.25 25)",
          700: "oklch(0.48 0.22 25)",
          900: "oklch(0.35 0.16 25)",
          DEFAULT: "oklch(0.62 0.25 25)",
        },
        info: {
          50: "oklch(0.98 0.02 195)",
          100: "oklch(0.95 0.04 195)",
          500: "oklch(0.65 0.15 195)",
          600: "oklch(0.55 0.15 195)",
          700: "oklch(0.48 0.13 195)",
          900: "oklch(0.35 0.1 195)",
          DEFAULT: "oklch(0.65 0.15 195)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};
