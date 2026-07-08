import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";

export default defineConfig({
  plugins: [vue()],
  root: "apps/desktop",
  resolve: {
    alias: {
      "@": resolve(__dirname, "apps/desktop"),
    },
  },
  server: { port: 5173 },
});
