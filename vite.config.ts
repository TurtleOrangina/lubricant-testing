import { fileURLToPath, URL } from "node:url";

import vue from "@vitejs/plugin-vue";

import { defineConfig } from "vite-plus";

export default defineConfig({
  build: {
    chunkSizeWarningLimit: 750,
    rollupOptions: {
      output: {
        codeSplitting: false,
        entryFileNames: "assets/[name].js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name].[ext]",
      },
    },
  },
  staged: {
    "*": "vp check --fix",
  },
  fmt: { ignorePatterns: ["docs/**"] },
  lint: { options: { typeAware: true, typeCheck: true } },
  plugins: [vue()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
