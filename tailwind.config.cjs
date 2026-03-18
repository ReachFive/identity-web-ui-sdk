/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "selector",
  important: ".r5-widget",
  corePlugins: {
    container: false,
    preflight: false,
  },
  content: {
    relative: true,
    files: ["./src/**/*.{js,ts,jsx,tsx}"],
  },
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent) / .5)",
          foreground: "hsl(var(--accent-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        theme: "hsl(var(--text))",
      },
      spacing: {
        DEFAULT: "var(--spacing)",
      },
      borderRadius: {
        DEFAULT: "var(--radius)",
      },
      fontSize: {
        DEFAULT: "var(--font-size)",
      },
      lineHeight: {
        DEFAULT: "var(--leading-generic)",
      },
      width: {
        icon: "var(--leading-generic)",
      },
      height: {
        icon: "var(--leading-generic)",
      },
      padding: {
        DEFAULT: "var(--spacing-padding-y) var(--spacing-padding-x)",
      },
      borderWidth: {
        DEFAULT: "var(--border-width)",
      },
    },
  },
};
