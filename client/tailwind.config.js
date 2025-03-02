/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
    screens: {
      sm: "360px",
      md: "540px",
      lg: "768px",
      xl: "1280px",
    },
    fontFamily : {
      JetBrains: ["JetBrains Mono", "serif"]
    },
    container: {
      center: true,
      padding: {
        DEFAULT: "12px",
        lg: "28px"
      },
      screens: {
        md: "680px",
        lg: "940px",
        xl: "1200px",
      },
    }
  },
  plugins: [],
}

