import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  // Relative URLs so the site works when hosted under a subpath (e.g. GitHub Pages project sites).
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        privacy: resolve(__dirname, "privacy.html"),
      },
    },
    target: "es2015",
    minify: "terser",
    terserOptions: {
      safari10: true,
    },
  },
  esbuild: {
    target: "es2015",
    jsx: "automatic",
    jsxImportSource: "preact",
  },
  resolve: {
    alias: {
      react: "preact/compat",
      "react-dom": "preact/compat",
      "preact/jsx-runtime": "preact/jsx-runtime",
      "preact/jsx-dev-runtime": "preact/jsx-dev-runtime",
    },
    dedupe: ["preact", "preact/compat", "preact/hooks"],
  },
});
