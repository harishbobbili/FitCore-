import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["lib/**/*.test.ts", "lib/**/*.test.tsx", "hooks/**/*.test.ts", "hooks/**/*.test.tsx"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["lib/**/*.{ts,tsx}"],
      exclude: ["lib/**/*.test.{ts,tsx}", "lib/**/*.d.ts"],
    },
    mockReset: true,
    restoreMocks: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
