import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const r = (p) => fileURLToPath(new URL(p, import.meta.url));

// Build der MV3-Extension. Mehrere HTML-Einstiegspunkte + Background-Worker,
// stabile (unhashte) Dateinamen, damit das statische Manifest sie referenzieren kann.
export default defineConfig({
  root,
  // erlaubt Imports aus ../src (Kern + Web-App-UI)
  server: { fs: { allow: [root, r("..")] } },
  build: {
    outDir: r("./dist"),
    emptyOutDir: true,
    target: "esnext", // Top-Level-await im Side-Panel-Einstieg
    modulePreload: { polyfill: false }, // kein Inline-Skript (MV3-CSP)
    rollupOptions: {
      input: {
        sidepanel: r("./sidepanel.html"),
        popup: r("./popup.html"),
        options: r("./options.html"),
        background: r("./src/background.js"),
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
});
