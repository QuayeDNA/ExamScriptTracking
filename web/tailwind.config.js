/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      // Font Family
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "Fira Code",
          "SF Mono",
          "Monaco",
          "Cascadia Code",
          "Courier New",
          "monospace",
        ],
        display: ["Cal Sans", "Inter", "sans-serif"],
      },

      // Font Size Scale (Major Third - 1.125 ratio)
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1rem" }], // 12px
        sm: ["0.875rem", { lineHeight: "1.25rem" }], // 14px
        base: ["1rem", { lineHeight: "1.5rem" }], // 16px
        lg: ["1.125rem", { lineHeight: "1.75rem" }], // 18px
        xl: ["1.25rem", { lineHeight: "1.75rem" }], // 20px
        "2xl": ["1.5rem", { lineHeight: "2rem" }], // 24px
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }], // 30px
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }], // 36px
        "5xl": ["3rem", { lineHeight: "1" }], // 48px
        "6xl": ["3.75rem", { lineHeight: "1" }], // 60px
      },

      // Letter Spacing
      letterSpacing: {
        tighter: "-0.05em",
        tight: "-0.025em",
        normal: "0",
        wide: "0.025em",
        wider: "0.05em",
        widest: "0.1em",
      },

      // Border Radius with Design System tokens
      borderRadius: {
        none: "0",
        sm: "var(--radius-sm)", // 4px
        DEFAULT: "var(--radius-base)", // 6px
        md: "var(--radius-md)", // 8px
        lg: "var(--radius-lg)", // 12px
        xl: "var(--radius-xl)", // 16px
        "2xl": "var(--radius-2xl)", // 24px
        "3xl": "var(--radius-3xl)", // 32px
        full: "var(--radius-full)", // 9999px
      },

      // Spacing Scale (4px base unit)
      spacing: {
        0: "0",
        px: "1px",
        0.5: "var(--space-0-5)", // 2px
        1: "var(--space-1)", // 4px
        1.5: "var(--space-1-5)", // 6px
        2: "var(--space-2)", // 8px
        2.5: "var(--space-2-5)", // 10px
        3: "var(--space-3)", // 12px
        3.5: "var(--space-3-5)", // 14px
        4: "var(--space-4)", // 16px
        5: "var(--space-5)", // 20px
        6: "var(--space-6)", // 24px
        7: "var(--space-7)", // 28px
        8: "var(--space-8)", // 32px
        10: "var(--space-10)", // 40px
        12: "var(--space-12)", // 48px
        14: "var(--space-14)", // 56px
        16: "var(--space-16)", // 64px
        20: "var(--space-20)", // 80px
        24: "var(--space-24)", // 96px
        32: "var(--space-32)", // 128px
      },

      // Box Shadow with Design System tokens
      boxShadow: {
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        DEFAULT: "var(--shadow-base)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
        "2xl": "var(--shadow-2xl)",
        inner: "var(--shadow-inner)",
        primary: "var(--shadow-primary)",
        success: "var(--shadow-success)",
        error: "var(--shadow-error)",
        none: "none",
      },

      // Animation Duration
      transitionDuration: {
        instant: "0ms",
        fast: "150ms",
        DEFAULT: "200ms",
        moderate: "300ms",
        slow: "500ms",
        slowest: "700ms",
      },

      // Animation Timing Functions
      transitionTimingFunction: {
        "ease-smooth": "cubic-bezier(0.4, 0, 0.6, 1)",
        "ease-snappy": "cubic-bezier(0.4, 0.14, 0.3, 1)",
        "ease-spring": "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
      },

      // Colors with Design System tokens
      colors: {
        // Design System Primary Colors
        primary: {
          50: "rgb(var(--primary-50) / <alpha-value>)",
          100: "rgb(var(--primary-100) / <alpha-value>)",
          200: "rgb(var(--primary-200) / <alpha-value>)",
          300: "rgb(var(--primary-300) / <alpha-value>)",
          400: "rgb(var(--primary-400) / <alpha-value>)",
          500: "rgb(var(--primary-500) / <alpha-value>)",
          600: "rgb(var(--primary-600) / <alpha-value>)",
          700: "rgb(var(--primary-700) / <alpha-value>)",
          800: "rgb(var(--primary-800) / <alpha-value>)",
          900: "rgb(var(--primary-900) / <alpha-value>)",
          950: "rgb(var(--primary-950) / <alpha-value>)",
          DEFAULT: "rgb(var(--primary-500) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground))",
        },

        // Semantic Colors
        success: {
          50: "rgb(var(--success-50) / <alpha-value>)",
          100: "rgb(var(--success-100) / <alpha-value>)",
          500: "rgb(var(--success-500) / <alpha-value>)",
          600: "rgb(var(--success-600) / <alpha-value>)",
          700: "rgb(var(--success-700) / <alpha-value>)",
          900: "rgb(var(--success-900) / <alpha-value>)",
          DEFAULT: "rgb(var(--success-500) / <alpha-value>)",
        },

        warning: {
          50: "rgb(var(--warning-50) / <alpha-value>)",
          100: "rgb(var(--warning-100) / <alpha-value>)",
          500: "rgb(var(--warning-500) / <alpha-value>)",
          600: "rgb(var(--warning-600) / <alpha-value>)",
          700: "rgb(var(--warning-700) / <alpha-value>)",
          900: "rgb(var(--warning-900) / <alpha-value>)",
          DEFAULT: "rgb(var(--warning-500) / <alpha-value>)",
        },

        error: {
          50: "rgb(var(--error-50) / <alpha-value>)",
          100: "rgb(var(--error-100) / <alpha-value>)",
          500: "rgb(var(--error-500) / <alpha-value>)",
          600: "rgb(var(--error-600) / <alpha-value>)",
          700: "rgb(var(--error-700) / <alpha-value>)",
          900: "rgb(var(--error-900) / <alpha-value>)",
          DEFAULT: "rgb(var(--error-500) / <alpha-value>)",
        },

        info: {
          50: "rgb(var(--info-50) / <alpha-value>)",
          100: "rgb(var(--info-100) / <alpha-value>)",
          500: "rgb(var(--info-500) / <alpha-value>)",
          600: "rgb(var(--info-600) / <alpha-value>)",
          700: "rgb(var(--info-700) / <alpha-value>)",
          900: "rgb(var(--info-900) / <alpha-value>)",
          DEFAULT: "rgb(var(--info-500) / <alpha-value>)",
        },

        // Gray Scale
        gray: {
          50: "rgb(var(--gray-50) / <alpha-value>)",
          100: "rgb(var(--gray-100) / <alpha-value>)",
          200: "rgb(var(--gray-200) / <alpha-value>)",
          300: "rgb(var(--gray-300) / <alpha-value>)",
          400: "rgb(var(--gray-400) / <alpha-value>)",
          500: "rgb(var(--gray-500) / <alpha-value>)",
          600: "rgb(var(--gray-600) / <alpha-value>)",
          700: "rgb(var(--gray-700) / <alpha-value>)",
          800: "rgb(var(--gray-800) / <alpha-value>)",
          900: "rgb(var(--gray-900) / <alpha-value>)",
          950: "rgb(var(--gray-950) / <alpha-value>)",
        },

        // Status Colors (Batch Workflow)
        status: {
          "not-started": "rgb(var(--status-not-started) / <alpha-value>)",
          "in-progress": "rgb(var(--status-in-progress) / <alpha-value>)",
          submitted: "rgb(var(--status-submitted) / <alpha-value>)",
          "in-transit": "rgb(var(--status-in-transit) / <alpha-value>)",
          "with-lecturer": "rgb(var(--status-with-lecturer) / <alpha-value>)",
          "under-grading": "rgb(var(--status-under-grading) / <alpha-value>)",
          graded: "rgb(var(--status-graded) / <alpha-value>)",
          returned: "rgb(var(--status-returned) / <alpha-value>)",
          completed: "rgb(var(--status-completed) / <alpha-value>)",
          archived: "rgb(var(--status-archived) / <alpha-value>)",
        },

        // shadcn/ui Theme Colors
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        chart: {
          1: "var(--chart-1)",
          2: "var(--chart-2)",
          3: "var(--chart-3)",
          4: "var(--chart-4)",
          5: "var(--chart-5)",
        },
      },

      // Container widths
      container: {
        center: true,
        padding: {
          DEFAULT: "1rem",
          sm: "1.5rem",
          md: "2rem",
          lg: "3rem",
        },
        screens: {
          xs: "320px",
          sm: "640px",
          md: "768px",
          lg: "1024px",
          xl: "1280px",
          "2xl": "1536px",
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
