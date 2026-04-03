import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      react: "preact/compat",
      "react-dom": "preact/compat",
    },
    dedupe: ["preact", "preact/compat", "preact/hooks"],
  },
  test: {
    environment: "jsdom",
    globals: true,
    watch: false,
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    coverage: {
      reporter: ["text", "html"],
      exclude: ["node_modules/", "src/**/*.test.ts"],
    },
  },
});
