import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "/",
  optimizeDeps: {
    // Prebuilt demos under /public contain bare imports that aren't
    // installed here (e.g. @emotion/is-prop-valid). The default scanner
    // crawls every .html file, including those demos, and aborts
    // pre-bundling when it can't resolve them. Restrict the scan to the
    // app entry so dependency pre-bundling always succeeds.
    entries: ["index.html"],
  },
});

