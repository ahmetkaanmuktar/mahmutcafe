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
          50: "#fdf8f3",
          100: "#f9ede0",
          200: "#f2d9bd",
          300: "#e8bf94",
          400: "#dd9d66",
          500: "#d4824a",
          600: "#c66a3f",
          700: "#a55336",
          800: "#854432",
          900: "#6c392c",
        },
      },
    },
  },
  plugins: [],
};

export default config;
