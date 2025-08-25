/** @type {import('tailwindcss').Config} */
module.exports = {
  important: ".r5-widget",
  prefix: "r5-",
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
        primary: {
          DEFAULT: "var(--color-primary)",
          foreground: "var(--color-primary)",
        },
        destructive: {
          DEFAULT: "var(--color-destructive)",
          foreground: "var(--color-destructive)",
        },
        background: "var(--color-background)",
        border: "var(--color-border)",
        theme: "var(--color-text)",
      },
      spacing: {
        DEFAULT: "calc(var(--spacing)*1px)",
      },
      borderRadius: {
        DEFAULT: "calc(var(--border-radius)*1px)",
      },
      fontSize: {
        generic: ["calc(var(--generic)*1px)", { lineHeight: "1.5" }],
      },
      width: {
        icon: `calc(var(--font-generic)*2px)`,
      },
      height: {
        icon: "calc(var(--font-generic)*2px)",
      },
      padding: {
        generic:
          "calc(var(--spacing-padding-y)*1px) calc(var(--spacing-padding-x)*1px) calc(var(--spacing-padding-y)*1px) calc(var(--spacing-padding-x)*1px)", //"calc(var(--spacing-padding-y)*1px) calc(var(--spacing-padding-x)*1px) calc(var(--spacing-padding-y)*1px) calc(var(--spacing-padding-x)*1px)",
      },
      margin: {
        innerBlock: "calc(var(--spacing-block-inner-height)*1px)",
      },
      borderWidth: {
        DEFAULT: "calc(var(--border-width)*1px)",
      },
    },
  },
};
