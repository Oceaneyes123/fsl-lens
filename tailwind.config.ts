import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#f7f9fb",
        coral: "#D65F4C",
        ink: "#191c1e",
        line: "#bcc9c6",
        mist: "#f7f9fb",
        muted: "#3d4947",
        panel: "#ffffff",
        panelSoft: "#f2f4f6",
        primary: "#00685f",
        primaryContainer: "#008378",
        secondary: "#4648d4",
        secondaryContainer: "#6063ee",
        teal: "#00685f",
      },
      boxShadow: {
        soft: "0 4px 6px -1px rgba(15, 23, 42, 0.05)",
        floating: "0 10px 15px -3px rgba(15, 23, 42, 0.1)",
      },
      fontFamily: {
        body: ["var(--font-inter)", "Inter", "sans-serif"],
        heading: ["var(--font-jakarta)", "Plus Jakarta Sans", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
