import type { Config } from "tailwindcss";
export default { content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"], theme: { extend: {
  colors: { ink: "#050507", graphite: "#121216", violet: { DEFAULT: "#8b3dff", glow: "#a86bff" }, gold: "#f5c451", silver: "#c9ccd3", bronze: "#cd7f32", muted: "#8a8d98" },
  fontFamily: { display: ["Impact", "Haettenschweiler", "Arial Narrow Bold", "sans-serif"] },
  borderRadius: { card: "1.25rem" },
  boxShadow: { glow: "0 0 60px -10px rgba(139,61,255,.6)", gold: "0 0 60px -10px rgba(245,196,81,.55)" } } }, plugins: [] } satisfies Config;
