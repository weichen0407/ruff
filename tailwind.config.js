/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Ruff primary color - Energy Orange
        primary: {
          DEFAULT: "#FF6B00",
          50: "#FFF4E6",
          100: "#FFE4CC",
          200: "#FFCC99",
          300: "#FFB366",
          400: "#FF9933",
          500: "#FF6B00",
          600: "#CC5500",
          700: "#994000",
          800: "#662B00",
          900: "#331500",
        },
        // Ruff background colors
        background: {
          light: "#FFFFFF",
          dark: "#0A0A0A",
        },
        // Pace zone colors (E/M/T/I/R)
        pace: {
          easy: "#10B981", // E - Green
          moderate: "#3B82F6", // M - Blue
          threshold: "#F59E0B", // T - Amber
          interval: "#EF4444", // I - Red
          recovery: "#8B5CF6", // R - Purple
        },
      },
      fontFamily: {
        lexend: ["Lexend"],
        manrope: ["Manrope"],
      },
      borderRadius: {
        button: "16px",
        card: "28px",
        input: "12px",
      },
    },
  },
  plugins: [],
};
