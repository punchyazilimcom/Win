/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0D0D0D",
        card: "#131313",
        card2: "#171717",
        line: "#262626",
        line2: "#1c1c1c",
        yellow: "#F4DF16",
        "yellow-dim": "#9c9112",
        txt: "#f4f4f0",
        muted: "#8a8a83",
        muted2: "#5a5a55",
        ok: "#5fd36a",
      },
      fontFamily: {
        sans: ['"Bricolage Grotesque"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      borderRadius: {
        DEFAULT: "6px",
      },
      keyframes: {
        pop: {
          from: { opacity: "0", transform: "translateY(14px)" },
          to: { opacity: "1", transform: "none" },
        },
        fade: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "none" },
        },
      },
      animation: {
        pop: "pop .5s ease backwards",
        fade: "fade .35s ease",
      },
    },
  },
  plugins: [],
};
