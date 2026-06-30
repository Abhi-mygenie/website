/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Clash Display", "Poppins", "sans-serif"],
        sans: ["Poppins", "sans-serif"],
      },
      colors: {
        brand: {
          green: "#10B981",
          greenDark: "#059669",
          deep: "#10402A",
          deepSurface: "#18512F",
          orange: "#f26b33",
          orangeSoft: "#FFF1E8",
          yellow: "#FFE100",
          sand: "#F6F8F5",
          ink: "#14201A",
          muted: "#5B6B61",
          line: "#E6EAE6",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
