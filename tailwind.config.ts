import type { Config } from "tailwindcss";
export default {
  darkMode: "class", content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: { extend: { colors: { ink: "#111111", cloud: "#f5f5f3", gold: "#b79762" }, boxShadow: { soft: "0 18px 60px rgba(15,15,15,.08)" }, borderRadius: { "4xl": "2rem" } } }, plugins: []
} satisfies Config;
