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
        ink: "#101828",
        line: "#D8DEE8",
        mist: "#F6F8FA",
        teal: "#0F766E",
        coral: "#D65F4C",
      },
      boxShadow: {
        soft: "0 16px 40px rgba(16, 24, 40, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
