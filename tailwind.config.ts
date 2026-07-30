import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1F2E22",
        "ink-soft": "#4A5A4C",
        paper: "#F1E8D8",
        "paper-raised": "#FBF6EA",
        rust: "#B5502E",
        ochre: "#C6932F",
        moss: "#5C7A52",
        brick: "#9E3B2E",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        body: ["var(--font-worksans)", "sans-serif"],
        mono: ["var(--font-plexmono)", "monospace"],
      },
      backgroundImage: {
        grain: "radial-gradient(circle, rgba(31,46,34,0.05) 1px, transparent 1px)",
      },
      backgroundSize: {
        grain: "8px 8px",
      },
    },
  },
  plugins: [],
};

export default config;
