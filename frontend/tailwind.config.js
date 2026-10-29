/** @type {import('tailwindcss').Config} */
function withOpacity(variableName) {
  return ({ opacityValue }) => {
    if (opacityValue !== undefined) {
      return `rgba(var(${variableName}-rgb), ${opacityValue})`
    }
    return `var(${variableName})`
  }
}

export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // ISA-101 semantic tokens
        bg: withOpacity("--bg"),
        surface: withOpacity("--surface"),
        raised: withOpacity("--raised"),
        border: withOpacity("--border"),
        text: withOpacity("--text"),
        muted: withOpacity("--muted"),
        accent: withOpacity("--accent"),
        "series-temp": withOpacity("--series-temp"),
        "series-vib": withOpacity("--series-vib"),
        "series-press": withOpacity("--series-press"),
        warn: withOpacity("--warn"),
        crit: withOpacity("--crit"),
        "sensor-fault": withOpacity("--sensor-fault"),

        // Shadcn UI compatibility mappings
        background: "var(--bg)",
        foreground: "var(--text)",
        input: "var(--border)",
        ring: "var(--accent)",
        card: {
          DEFAULT: "var(--surface)",
          foreground: "var(--text)",
        },
        popover: {
          DEFAULT: "var(--raised)",
          foreground: "var(--text)",
        },
        primary: {
          DEFAULT: "var(--accent)",
          foreground: "var(--bg)",
        },
        secondary: {
          DEFAULT: "var(--surface)",
          foreground: "var(--text)",
        },
        destructive: {
          DEFAULT: "var(--crit)",
          foreground: "var(--text)",
        },
      },
      borderRadius: {
        DEFAULT: "4px",
        sm: "3px",
        md: "4px",
        lg: "6px",
      },
      fontFamily: {
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        sans: ['"IBM Plex Sans"', '"Inter"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
