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

// https://vitejs.dev/config/
export default ({ mode }) => {
  return defineConfig({
    plugins: [vue(), htmlPluginModule(mode), autoImportModule],
    base: loadEnv(mode, process.cwd()).VITE_APP_PUBLIC_PATH,
    resolve: {
      alias: resolveAliasModule,
    },
    server: {
      // 瑙ｅ喅鐑洿鏂颁笉鍚屾闂
      hmr: true,
      //鏈嶅姟鍣ㄤ富鏈哄悕 閰嶇疆'0.0.0.0' network榛樿鏈満ip,Local榛樿localhost.濡傛灉涓嶉厤缃负绌哄垯Local鍙湁绔彛,鑻ラ厤缃负localhost浼氬鑷磏etwork鍦板潃鏃犳硶璁块棶
      host: "0.0.0.0",
      //绔彛鍙?
      port: 5173,
      //璁句负 true 鏃惰嫢绔彛宸茶鍗犵敤鍒欎細鐩存帴閫€鍑猴紝鑰屼笉鏄皾璇曚笅涓€涓彲鐢ㄧ鍙?
      strictPort: false,
      //鏈嶅姟鍣ㄥ惎鍔ㄦ椂鑷姩鍦ㄦ祻瑙堝櫒涓墦寮€搴旂敤绋嬪簭,褰撴鍊间负瀛楃涓叉椂锛屼細琚敤浣?URL 鐨勮矾寰勫悕
      open: false,
      //鑷畾涔変唬鐞嗚鍒?
      proxy: proxyOption(mode),
    },
    css: {
      preprocessorOptions: {
        less: {
          // 鍏ㄥ眬寮曞叆less鏍峰紡鍙橀噺
          additionalData: `@import "@/style/global.less";`,
        },
      },
    },
    build: {
      sourcemap: false, // 涓嶇敓鎴恗ap.js
      outDir: "dist", //鎸囧畾杈撳嚭璺緞
      assetsDir: "static/", // 鎸囧畾鐢熸垚闈欐€佽祫婧愮殑瀛樻斁璺緞
      rollupOptions: {
        output: {
          manualChunks: manualChunksModule,
          chunkFileNames: chunkFileNamesModule,
          assetFileNames: "static/[ext]/[name]-[hash].[ext]", // 闈欐€佽祫婧愭枃浠剁殑鍚嶇О鍜岃矾寰?
        },
      },
      ...minifyModule(mode, "terser"),
    },
  });
};
