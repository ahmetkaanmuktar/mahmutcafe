import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cafe: {
          bg: "#0f0e0c",
          surface: "#1a1814",
          card: "#221f1a",
          border: "#2e2a24",
          accent: "#c8a96e",
          accentHover: "#e0c083",
          text: "#f0ebe3",
          textMuted: "#a8a196",
          danger: "#e65a5a",
          dangerHover: "#ff6e6e",
          dangerBg: "#2d1a1a",
        },
      },
      fontFamily: {
        heading: ["var(--font-syne)"],
        sans: ["var(--font-dm-sans)"],
      },
      backgroundImage: {
        'radial-cafe': 'radial-gradient(circle at center, #1a1814 0%, #0f0e0c 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
