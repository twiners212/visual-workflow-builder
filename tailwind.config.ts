import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "on-error": "var(--on-error)",
        "surface-container-low": "var(--surface-container-low)",
        "on-tertiary": "var(--on-tertiary)",
        "surface-dim": "var(--surface-dim)",
        "on-background": "var(--on-background)",
        "on-secondary-fixed": "var(--on-secondary-fixed)",
        "on-surface-variant": "var(--on-surface-variant)",
        "primary-container": "var(--primary-container)",
        "on-tertiary-fixed-variant": "var(--on-tertiary-fixed-variant)",
        "tertiary-fixed": "var(--tertiary-fixed)",
        "secondary-fixed": "var(--secondary-fixed)",
        "on-tertiary-container": "var(--on-tertiary-container)",
        "on-secondary-container": "var(--on-secondary-container)",
        "primary-fixed-dim": "var(--primary-fixed-dim)",
        "error-container": "var(--error-container)",
        "tertiary": "var(--tertiary)",
        "on-secondary-fixed-variant": "var(--on-secondary-fixed-variant)",
        "surface": "var(--surface)",
        "inverse-on-surface": "var(--inverse-on-surface)",
        "surface-container": "var(--surface-container)",
        "error": "var(--error)",
        "on-primary-container": "var(--on-primary-container)",
        "inverse-primary": "var(--inverse-primary)",
        "surface-container-lowest": "var(--surface-container-lowest)",
        "outline-variant": "var(--outline-variant)",
        "on-tertiary-fixed": "var(--on-tertiary-fixed)",
        "secondary": "var(--secondary)",
        "on-error-container": "var(--on-error-container)",
        "surface-tint": "var(--surface-tint)",
        "secondary-fixed-dim": "var(--secondary-fixed-dim)",
        "surface-container-high": "var(--surface-container-high)",
        "surface-container-highest": "var(--surface-container-highest)",
        "inverse-surface": "var(--inverse-surface)",
        "on-primary-fixed": "var(--on-primary-fixed)",
        "tertiary-fixed-dim": "var(--tertiary-fixed-dim)",
        "on-primary": "var(--on-primary)",
        "surface-bright": "var(--surface-bright)",
        "primary-fixed": "var(--primary-fixed)",
        "tertiary-container": "var(--tertiary-container)",
        "on-primary-fixed-variant": "var(--on-primary-fixed-variant)",
        "outline": "var(--outline)",
        "on-secondary": "var(--on-secondary)",
        "primary": "var(--primary)",
        "on-surface": "var(--on-surface)",
        "background": "var(--background)",
        "secondary-container": "var(--secondary-container)",
        "surface-variant": "var(--surface-variant)"
      },
      borderRadius: {
        "DEFAULT": "0.125rem",
        "lg": "0.25rem",
        "xl": "0.5rem",
        "full": "0.75rem"
      },
      spacing: {
        "sm": "8px",
        "base": "4px",
        "lg": "24px",
        "xl": "32px",
        "md": "16px",
        "canvas-grid": "20px",
        "xs": "4px",
        "sidebar-width": "260px"
      },
      fontFamily: {
        "headline-md": ["var(--font-geist-sans)", "sans-serif"],
        "label-sm": ["var(--font-geist-mono)", "monospace"],
        "body-lg": ["var(--font-geist-sans)", "sans-serif"],
        "headline-sm": ["var(--font-geist-sans)", "sans-serif"],
        "body-md": ["var(--font-geist-sans)", "sans-serif"],
        "headline-lg-mobile": ["var(--font-geist-sans)", "sans-serif"],
        "headline-lg": ["var(--font-geist-sans)", "sans-serif"],
        "label-md": ["var(--font-geist-mono)", "monospace"]
      },
      fontSize: {
        "headline-md": ["24px", { lineHeight: "32px", letterSpacing: "-0.01em", fontWeight: "600" }],
        "label-sm": ["10px", { lineHeight: "14px", letterSpacing: "0.05em", fontWeight: "500" }],
        "body-lg": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "headline-sm": ["18px", { lineHeight: "28px", fontWeight: "600" }],
        "body-md": ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "headline-lg-mobile": ["24px", { lineHeight: "32px", fontWeight: "600" }],
        "headline-lg": ["30px", { lineHeight: "36px", letterSpacing: "-0.02em", fontWeight: "600" }],
        "label-md": ["12px", { lineHeight: "16px", fontWeight: "500" }]
      }
    },
  },
  plugins: [],
};

export default config;
