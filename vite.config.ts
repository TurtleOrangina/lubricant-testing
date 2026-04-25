import { fileURLToPath, URL } from "node:url";

import vue from "@vitejs/plugin-vue";
import { viteSingleFile } from "vite-plugin-singlefile";

import { defineConfig } from "vite-plus";

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  fmt: {},
  lint: { options: { typeAware: true, typeCheck: true } },
  plugins: [vue(), viteSingleFile()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
