import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        foreground: "var(--foreground)",
        background: "#0a0a0a", // Dark background
        accent: "#8E44AD", // Purple accent
        textPrimary: "#FFFFFF", // White text
        textSecondary: "#B3B3C6", // Light gray text
        cardBg: "#2C2C3E", // Card background
        buttonBg: "#6C63FF", // Button background
        buttonHover: "#8E75FF", // Button hover color
      },
    },
  },
  plugins: [],
} satisfies Config;
