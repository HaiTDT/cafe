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
        // Dark Luxury Theme
        primary: "#D4AF37", // Warm Gold
        "on-primary": "#111111",
        "primary-container": "#4A3B12",
        "on-primary-container": "#FDE047",
        
        secondary: "#3E2723", // Wood Brown
        "on-secondary": "#ffffff",
        "secondary-container": "#2C1E16",
        "on-secondary-container": "#D7CCC8",
        
        tertiary: "#1C1C1C", // Charcoal
        "on-tertiary": "#ffffff",
        "tertiary-container": "#2A2A2A",
        "on-tertiary-container": "#E0E0E0",
        
        background: "#0A0A0A", // Deep Black
        "on-background": "#F5F5F5",
        
        surface: "#111111", // Slightly lighter black for cards
        "on-surface": "#F5F5F5",
        "surface-variant": "#1A1A1A",
        "on-surface-variant": "#B3B3B3",
        
        "surface-container-lowest": "#050505",
        "surface-container-low": "#0D0D0D",
        "surface-container": "#111111",
        "surface-container-high": "#1C1C1C",
        "surface-container-highest": "#262626",
        
        outline: "#333333",
        "outline-variant": "#222222",
        
        error: "#CF6679",
        "on-error": "#000000",
        "error-container": "#B3261E",
        "on-error-container": "#F9DEDC",
      },
      backgroundImage: {
        'glass': 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)',
        'glass-border': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)',
      },
      fontFamily: {
        headline: ["Cinzel", "Playfair Display", "serif"],
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
