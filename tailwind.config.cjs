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
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
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
        // Component tokens (`--r5-*`) — each one must also be declared in `cn()` (src/lib/utils.ts).
        "button-bg": "var(--r5-button-bg)",
        "button-hover-bg": "var(--r5-button-hover-bg)",
        "button-subtle-bg": "var(--r5-button-subtle-bg)",
        "button-text": "var(--r5-button-text)",
        "button-hover-text": "var(--r5-button-hover-text)",
        "button-border-color": "var(--r5-button-border-color)",
        "button-hover-border-color": "var(--r5-button-hover-border-color)",
        "input-bg": "var(--r5-input-bg)",
        "input-disabled-bg": "var(--r5-input-disabled-bg)",
        "input-text": "var(--r5-input-text)",
        "input-placeholder-text": "var(--r5-input-placeholder-text)",
        "input-border-color": "var(--r5-input-border-color)",
        "link-text": "var(--r5-link-text)",
        "link-hover-text": "var(--r5-link-hover-text)",
        "heading-text": "var(--r5-heading-text)",
      },
      spacing: {
        DEFAULT: "var(--spacing)",
      },
      borderRadius: {
        DEFAULT: "var(--radius)",
        button: "var(--r5-button-radius)",
        input: "var(--r5-input-radius)",
      },
      fontSize: {
        DEFAULT: "var(--font-size)",
        "button-text-size": "var(--r5-button-text-size)",
        "input-text-size": "var(--r5-input-text-size)",
        "heading-text-size": "var(--r5-heading-text-size)",
      },
      fontWeight: {
        "button-font-weight": "var(--r5-button-font-weight)",
        "heading-font-weight": "var(--r5-heading-font-weight)",
      },
      lineHeight: {
        DEFAULT: "var(--leading)",
        button: "var(--r5-button-leading)",
        input: "var(--r5-input-leading)",
      },
      width: {
        icon: "var(--leading)",
      },
      height: {
        icon: "var(--leading)",
        "button-height": "var(--r5-button-height)",
        "input-height": "var(--r5-input-height)",
      },
      size: {
        "button-height": "var(--r5-button-height)",
      },
      maxWidth: {
        "widget-max-width": "var(--r5-widget-max-width)",
      },
      padding: {
        DEFAULT: "var(--padding-y) var(--padding-x)",
        "button-padding-x": "var(--r5-button-padding-x)",
        "button-padding-y": "var(--r5-button-padding-y)",
        "input-padding-x": "var(--r5-input-padding-x)",
        "input-padding-y": "var(--r5-input-padding-y)",
      },
      borderWidth: {
        DEFAULT: "var(--border-width)",
        "button-border-width": "var(--r5-button-border-width)",
        "input-border-width": "var(--r5-input-border-width)",
      },
      boxShadow: {
        "button-shadow": "var(--r5-button-shadow)",
        "input-shadow": "var(--r5-input-shadow)",
      },
    },
  },
  plugins: [
    ({ addUtilities }) => {
      addUtilities({
        ".link-decoration": { textDecoration: "var(--r5-link-decoration)" },
        ".link-decoration:hover": { textDecoration: "var(--r5-link-hover-decoration)" },
      });
    },
    ({ addBase }) => {
      addBase({
        ".r5-widget *, .r5-widget ::before, .r5-widget ::after": {
          boxSizing: "border-box",
          borderStyle: "solid",
          borderWidth: 0,
        },
        ".r5-widget hr": {
          height: 0,
          color: "inherit",
          borderTopWidth: "1px",
        },
        a: {
          color: "inherit",
          "-webkit-text-decoration": "inherit",
          textDecoration: "inherit",
        },
        "b,strong": {
          fontWeight: "bolder",
        },
        small: {
          fontSize: "80%",
        },
        "sub,sup": {
          verticalAlign: "baseline",
          fontSize: "75%",
          lineHeight: 0,
          position: "relative",
        },
        sub: {
          bottom: "-.25em",
        },
        sup: {
          top: "-.5em",
        },
      });
    },
  ],
};
