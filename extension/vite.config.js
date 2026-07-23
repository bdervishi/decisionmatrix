import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";
import { buildManifest } from "./manifest.js";

const root = fileURLToPath(new URL(".", import.meta.url));
const r = (p) => fileURLToPath(new URL(p, import.meta.url));

// Build-Ziel über EXT_TARGET wählen: "firefox" oder (default) "chrome".
const target = process.env.EXT_TARGET === "firefox" ? "firefox" : "chrome";
const outDir = r(target === "firefox" ? "./dist-firefox" : "./dist");

// Erzeugt das ziel-spezifische manifest.json direkt in den Build.
const manifestPlugin = {
  name: "emit-manifest",
  generateBundle() {
    this.emitFile({
      type: "asset",
      fileName: "manifest.json",
      source: JSON.stringify(buildManifest(target), null, 2),
    });
  },
};

// MV3-Extension: mehrere HTML-Einstiegspunkte + Background, stabile (unhashte)
// Dateinamen, damit das Manifest sie referenzieren kann.
export default defineConfig({
  root,
  plugins: [manifestPlugin],
  server: { fs: { allow: [root, r("..")] } },
  build: {
    outDir,
    emptyOutDir: true,
    target: "esnext",
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
