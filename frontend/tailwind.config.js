/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"] ,
  theme: {
    extend: {
      colors: {
        cream: "#f7f1e8",
        mint: "#dff3e4",
        leaf: "#b7e4c7",
        cocoa: "#6d4c41"
      },
      borderRadius: {
        xl: "1.25rem",
        "2xl": "1.75rem",
        "3xl": "2.25rem"
      },
      boxShadow: {
        soft: "0 12px 30px rgba(61, 82, 64, 0.12)"
      },
      fontFamily: {
        display: ["'ZCOOL XiaoWei'", "serif"],
        body: ["'ZCOOL XiaoWei'", "serif"]
      }
    }
  },
  plugins: []
};
