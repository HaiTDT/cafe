import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        rosewood: "#5D4037",
        sage: "#8D6E63",
        pearl: "#efebe9",
        "on-tertiary": "#ffffff",
        "on-primary": "#ffffff",
        "on-tertiary-container": "#ffc8c8",
        "primary-container": "#4e342e",
        "tertiary-fixed": "#d7ccc8",
        "surface-container-highest": "#d7ccc8",
        surface: "#fafafa",
        "on-secondary-fixed-variant": "#3e2723",
        "on-background": "#1a1c1c",
        "on-secondary-container": "#3e2723",
        error: "#ba1a1a",
        "secondary-fixed": "#d7ccc8",
        "on-surface-variant": "#3f4942",
        "surface-container-high": "#e8e8e8",
        "secondary-fixed-dim": "#bcaaa4",
        "primary-fixed-dim": "#8d6e63",
        primary: "#3e2723", // Dark Brown
        "on-tertiary-fixed": "#3e030c",
        "surface-variant": "#e2e2e2",
        "on-error-container": "#93000a",
        "error-container": "#ffdad6",
        "surface-container-lowest": "#ffffff",
        "on-error": "#ffffff",
        "on-surface": "#212121", // Almost black
        "on-primary-fixed-variant": "#3e2723",
        "secondary-container": "#5d4037",
        tertiary: "#111111", // Black
        secondary: "#5d4037", // Brown
        "tertiary-container": "#212121",
        background: "#fdfbf7",
        "outline-variant": "#bec9bf",
        "on-secondary-fixed": "#341100",
        "inverse-surface": "#2f3131",
        "on-primary-fixed": "#111111",
        "inverse-on-surface": "#f1f1f1",
        "on-tertiary-fixed-variant": "#111111",
        "tertiary-fixed-dim": "#8d6e63",
        "inverse-primary": "#8d6e63",
        "surface-bright": "#fafafa",
        "primary-fixed": "#d7ccc8",
        "surface-container": "#eeeeee",
        "on-secondary": "#ffffff",
        outline: "#6f7a71",
        "on-primary-container": "#d7ccc8",
        "surface-dim": "#dadada",
        "surface-container-low": "#f3f3f3",
        "surface-tint": "#4e342e",

        // Storefront Luxury Theme
        "luxury-primary": "#D4AF37",
        "luxury-on-primary": "#111111",
        "luxury-primary-container": "#4A3B12",
        "luxury-secondary": "#3E2723",
        "luxury-bg": "#0A0A0A",
        "luxury-surface": "#111111",
        "luxury-surface-low": "#0D0D0D",
        "luxury-text": "#F5F5F5",
        "luxury-text-variant": "#B3B3B3",
        "luxury-border": "#333333",
      },
      backgroundImage: {
        'glass': 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)',
        'glass-border': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)',
      },
      borderRadius: {
        DEFAULT: "0.125rem",
        lg: "0.25rem",
        xl: "0.5rem",
        full: "0.75rem"
      },
      fontFamily: {
        headline: ["Playfair Display", "serif"],
        body: ["Inter", "sans-serif"],
        label: ["Inter", "sans-serif"]
      },
      animation: {
        'fog': 'fog 30s linear infinite',
        'steam': 'steam 6s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fog: {
          '0%': { transform: 'translateX(-10%)', opacity: '0.3' },
          '50%': { opacity: '0.5' },
          '100%': { transform: 'translateX(10%)', opacity: '0.3' },
        },
        steam: {
          '0%': { transform: 'translateY(0) scale(1)', opacity: '0' },
          '30%': { opacity: '0.6' },
          '100%': { transform: 'translateY(-40px) scale(1.5)', opacity: '0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-15px)' },
        }
      }
    }
  },
  plugins: []
};

export default config;
