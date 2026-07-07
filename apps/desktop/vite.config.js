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
      // 解决热更新不同步问题
      hmr: true,
      //服务器主机名 配置'0.0.0.0' network默认本机ip,Local默认localhost.如果不配置为空则Local只有端口,若配置为localhost会导致network地址无法访问
      host: "0.0.0.0",
      //端口号
      port: 8883,
      //设为 true 时若端口已被占用则会直接退出，而不是尝试下一个可用端口
      strictPort: false,
      //服务器启动时自动在浏览器中打开应用程序,当此值为字符串时，会被用作 URL 的路径名
      open: false,
      //自定义代理规则
      proxy: proxyOption(mode),
    },
    css: {
      preprocessorOptions: {
        less: {
          // 全局引入less样式变量
          additionalData: `@import "@/style/global.less";`,
        },
      },
    },
    build: {
      sourcemap: false, // 不生成map.js
      outDir: "dist", //指定输出路径
      assetsDir: "static/", // 指定生成静态资源的存放路径
      rollupOptions: {
        output: {
          manualChunks: manualChunksModule,
          chunkFileNames: chunkFileNamesModule,
          assetFileNames: "static/[ext]/[name]-[hash].[ext]", // 静态资源文件的名称和路径
        },
      },
      ...minifyModule(mode, "terser"),
    },
  });
};
