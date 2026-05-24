import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}", // in case src is used in future
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brandBg: "#0A0A0F",
        brandCard: "#12121A",
        neonPurple: "#6C63FF",
        neonCyan: "#00D4FF",
      },
      boxShadow: {
        "neon-purple": "0 0 15px rgba(108, 99, 255, 0.4)",
        "neon-cyan": "0 0 15px rgba(0, 212, 255, 0.4)",
        "neon-purple-hover": "0 0 25px rgba(108, 99, 255, 0.7)",
        "neon-cyan-hover": "0 0 25px rgba(0, 212, 255, 0.7)",
        "glass": "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
      },
      backgroundImage: {
        "neon-grad": "linear-gradient(135deg, #6C63FF 0%, #00D4FF 100%)",
        "glass-grad": "linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)",
      },
    },
  },
  plugins: [],
};
export default config;
