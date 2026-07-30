import type { Config } from "tailwindcss";

/**
 * Dark-only "Sunset Atelier" glass theme, ported from the bucket_AI design
 * system. There is no light mode: the tokens below are the dark values and
 * `darkMode` is wired to `[data-theme="dark"]`, which the root layout always
 * sets, so shadcn/assistant-ui `dark:` variants resolve correctly.
 *
 * The original Inlet token names (ink / paper / rust / ochre / moss /
 * brick) are kept and re-pointed at dark sunset values rather than renamed.
 * The semantics survive the inversion (ink is still "text", paper is still
 * "ground"), so every existing `border-ink/10`-style className keeps working
 * and the diff stays in the containers instead of spreading across every file.
 */
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: ["selector", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // ── Inlet tokens, re-pointed to dark sunset ──────────────────
        ink: "#F5EFE6", // warm cream: primary text
        "ink-soft": "#C3B9AB", // secondary text, brightened for glass legibility
        paper: "#211E1C", // app ground
        "paper-raised": "#2D2926", // card ground, lifted above the canvas
        rust: "#F6864A", // primary accent, brightened so it glows on dark
        ochre: "#F6C78F", // drafted / pending
        moss: "#4ECBA0", // approved / sent
        brick: "#FF7466", // flagged / negative

        // ── Sunset palette (bucket_AI) ───────────────────────────────
        sunset: {
          DEFAULT: "#F6864A",
          strong: "#FBA875",
          // Filled-button orange stays deep so white text clears WCAG AA;
          // the light peach above would fail it.
          btn: "#C24A16",
          surface: "#3A2516",
          crimson: "#D92D39",
          maroon: "#7B1D35",
        },

        // ── Semantic surfaces ────────────────────────────────────────
        surface: {
          DEFAULT: "#2D2926",
          sunken: "#211E1C",
          muted: "#332E2B",
          active: "#3D2718",
        },
        line: {
          DEFAULT: "#38332E",
          soft: "#2C2823",
        },

        // ── Glass material ───────────────────────────────────────────
        glass: {
          surface: "var(--glass-surface)",
          "surface-strong": "var(--glass-surface-strong)",
          "surface-subtle": "var(--glass-surface-subtle)",
          border: "var(--glass-border)",
        },

        // ── shadcn / assistant-ui bridge ─────────────────────────────
        // Hex rather than var() so Tailwind's `/alpha` modifiers work in
        // `bg-primary/80`, `ring-ring/50`, `bg-destructive/10` etc.
        background: "#211E1C",
        foreground: "#F5EFE6",
        card: "#2D2926",
        "card-foreground": "#F5EFE6",
        popover: "#2D2926",
        "popover-foreground": "#F5EFE6",
        primary: "#C24A16",
        "primary-foreground": "#FFF6EF",
        secondary: "#332E2B",
        "secondary-foreground": "#F5EFE6",
        muted: "#332E2B",
        "muted-foreground": "#A49A88",
        accent: "#3A2516",
        "accent-foreground": "#FBA875",
        destructive: "#FF7466",
        "destructive-foreground": "#1A140F",
        border: "#38332E",
        input: "#38332E",
        ring: "#F6864A",
      },
      fontFamily: {
        // Single family. `display` and `body` stay as aliases so the existing
        // font-display / font-body classNames keep resolving, they just point
        // at the same typeface now; weight and tracking carry the hierarchy.
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-sans)", "system-ui", "sans-serif"],
        body: ["var(--font-sans)", "system-ui", "sans-serif"],
        // Kept for fenced code inside assistant replies only.
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      borderRadius: {
        // Nests outer to inner: panel (glass containers) > tile (cards inside
        // panels) > control (buttons, inputs, badges).
        panel: "20px",
        tile: "16px",
        control: "10px",
      },
      boxShadow: {
        e1: "var(--shadow-e1)",
        e2: "var(--shadow-e2)",
        e3: "var(--shadow-e3)",
        glass: "var(--glass-shadow)",
        "glass-lift": "var(--shadow-glass-lift)",
      },
      backdropBlur: {
        glass: "var(--glass-blur)",
        "glass-sm": "var(--glass-blur-sm)",
      },
      ringWidth: {
        // shadcn's base button uses focus-visible:ring-3, which v3 lacks.
        3: "3px",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "page-in": {
          "0%": { opacity: "0", transform: "translateY(8px) scale(0.994)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "rail-pulse": {
          "0%, 100%": { opacity: "0.35" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out both",
        "page-in": "page-in 0.5s cubic-bezier(0.22, 0.61, 0.36, 1) both",
        "rail-pulse": "rail-pulse 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
