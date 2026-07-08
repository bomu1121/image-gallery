import { defineConfig, loadEnv } from "vite";
import {
  autoImportModule,
  resolveAliasModule,
  htmlPluginModule,
  manualChunksModule,
  chunkFileNamesModule,
  minifyModule,
} from "./vite.config.module.js";
import { proxyOption } from "./vite.config.proxy.js";
import vue from "@vitejs/plugin-vue";

export default ({ mode }) => {
  return defineConfig({
    plugins: [vue(), htmlPluginModule(mode), autoImportModule],
    base: loadEnv(mode, process.cwd()).VITE_APP_PUBLIC_PATH,
    resolve: {
      alias: resolveAliasModule,
    },
    server: {
      hmr: true,
      host: "0.0.0.0",
      port: 5173,
      strictPort: false,
      open: false,
      proxy: proxyOption(mode),
    },
    css: {
      postcss: {},
    },
    build: {
      sourcemap: false,
      outDir: "dist",
      assetsDir: "static/",
      rollupOptions: {
        output: {
          manualChunks: manualChunksModule,
          chunkFileNames: chunkFileNamesModule,
          assetFileNames: "static/[ext]/[name]-[hash].[ext]",
        },
      },
      ...minifyModule(mode, "terser"),
    },
  });
};
