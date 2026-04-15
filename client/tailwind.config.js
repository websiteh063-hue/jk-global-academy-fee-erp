/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          500: "#1E3A8A",
          600: "#1d357d",
          700: "#172c67"
        },
        accent: {
          100: "#FEF3C7",
          300: "#FCD34D",
          400: "#FACC15",
          500: "#EAB308"
        }
      },
      boxShadow: {
        soft: "0 18px 45px -24px rgba(15, 23, 42, 0.45)"
      }
    }
  },
  plugins: []
};
