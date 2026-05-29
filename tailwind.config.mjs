/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/blocks/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/Header/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/Footer/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/heros/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "surface-bright": "#fef9f1",
        "on-secondary": "#ffffff",
        surface: "var(--color-surface, #fef9f1)",
        "on-secondary-fixed-variant": "#474745",
        "surface-container-low": "#f8f3ec",
        "on-tertiary-container": "#503d00",
        tertiary: "var(--color-tertiary, #755b00)",
        outline: "#747878",
        "primary-container": "#1c1b1b",
        "inverse-surface": "#32302c",
        "surface-container-lowest": "#ffffff",
        "medium-grey": "#6B6B6B",
        "error-container": "#ffdad6",
        "secondary-fixed-dim": "#c8c6c4",
        "on-secondary-fixed": "#1b1c1a",
        "on-primary": "#ffffff",
        "on-surface": "#1d1b17",
        "secondary-container": "#e1dfdc",
        "tertiary-fixed-dim": "#e6c364",
        secondary: "var(--color-secondary, #5e5e5c)",
        "surface-dim": "#ded9d2",
        "on-background": "#1d1b17",
        "surface-container-highest": "#e7e2db",
        "surface-tint": "#5f5e5e",
        "on-error": "#ffffff",
        background: "var(--color-background, #fef9f1)",
        "deep-navy": "#1D293E",
        "on-tertiary-fixed-variant": "#584400",
        "surface-container": "#f2ede6",
        "tertiary-fixed": "#ffe08f",
        "on-primary-container": "#858383",
        "on-surface-variant": "#444748",
        "on-primary-fixed-variant": "#474746",
        "on-secondary-container": "#636361",
        "on-tertiary": "#ffffff",
        error: "#ba1a1a",
        primary: "var(--color-primary, #000000)",
        "outline-variant": "#c4c7c7",
        "inverse-on-surface": "#f5f0e9",
        "on-primary-fixed": "#1c1b1b",
        "tertiary-container": "#c9a84c",
        "surface-container-high": "#ece7e0",
        "on-tertiary-fixed": "#241a00",
        "primary-fixed-dim": "#c8c6c5",
        "primary-fixed": "#e5e2e1",
        "surface-variant": "#e7e2db",
        "secondary-fixed": "#e4e2df",
        "on-error-container": "#93000a",
        "inverse-primary": "#c8c6c5",
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px",
      },
      spacing: {
        gutter: "24px",
        "margin-desktop": "80px",
        "margin-tablet": "40px",
        "max-width": "1440px",
        "margin-mobile": "20px",
        "stack-unit": "8px",
      },
      fontFamily: {
        "body-md": ["var(--font-outfit)", "sans-serif"],
        "label-nav": ["var(--font-outfit)", "sans-serif"],
        "headline-lg-mobile": ["var(--font-eb-garamond)", "serif"],
        "headline-md": ["var(--font-eb-garamond)", "serif"],
        "headline-lg": ["var(--font-eb-garamond)", "serif"],
        "body-lg": ["var(--font-outfit)", "sans-serif"],
        "display-lg": ["var(--font-eb-garamond)", "serif"],
        "label-sm": ["var(--font-outfit)", "sans-serif"],
        "headline-sm": ["var(--font-eb-garamond)", "serif"],
      },
      fontSize: {
        "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "label-nav": [
          "13px",
          {
            lineHeight: "16px",
            letterSpacing: "0.15em",
            fontWeight: "500",
          },
        ],
        "headline-lg-mobile": [
          "36px",
          { lineHeight: "44px", fontWeight: "400" },
        ],
        "headline-md": [
          "32px",
          { lineHeight: "40px", fontWeight: "400" },
        ],
        "headline-lg": [
          "48px",
          { lineHeight: "56px", fontWeight: "400" },
        ],
        "body-lg": ["18px", { lineHeight: "28px", fontWeight: "300" }],
        "display-lg": [
          "64px",
          {
            lineHeight: "72px",
            letterSpacing: "-0.02em",
            fontWeight: "400",
          },
        ],
        "label-sm": [
          "12px",
          {
            lineHeight: "16px",
            letterSpacing: "0.05em",
            fontWeight: "600",
          },
        ],
        "headline-sm": [
          "24px",
          { lineHeight: "32px", fontWeight: "500" },
        ],
      },
      typography: {
        DEFAULT: {
          css: [
            {
              '--tw-prose-body': 'var(--text)',
              '--tw-prose-headings': 'var(--text)',
              h1: {
                fontWeight: 'normal',
                marginBottom: '0.25em',
              },
            },
          ],
        },
        base: {
          css: [
            {
              h1: {
                fontSize: '2.5rem',
              },
              h2: {
                fontSize: '1.25rem',
                fontWeight: 600,
              },
            },
          ],
        },
        md: {
          css: [
            {
              h1: {
                fontSize: '3.5rem',
              },
              h2: {
                fontSize: '1.5rem',
              },
            },
          ],
        },
      },
    },
  },
}

export default config
