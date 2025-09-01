import AutoImport from "unplugin-auto-import/vite";
import { createHtmlPlugin } from "vite-plugin-html";
import { loadEnv } from "vite";
import { resolve } from "path";

// 自动引入
export const autoImportModule = AutoImport({
  dts: false,
  include: [/\.[tj]sx?$/, /\.vue$/],
  imports: [
    {
      vue: [
        "reactive",
        "toRefs",
        "ref",
        "shallowRef",
        "toRaw",
        "computed",
        "watch",
        "provide",
        "inject",
        "onBeforeMount",
        "onMounted",
        "onBeforeUpdate",
        "onUpdated",
        "onBeforeUnmount",
        "onUnmounted",
        "onActivated",
        "onDeactivated",
        "nextTick",
        "defineProps",
        "defineEmits",
        "defineModel",
        "getCurrentInstance",
        "markRaw",
      ],
      "vue-router": ["useRouter", "useRoute"],
      pinia: ["storeToRefs"],
    },
  ],
});

// 路径快捷访问别名
export const resolveAliasModule = {
  "@": resolve(__dirname, "src"),
  "@enum": resolve(__dirname, "src/plugin/enum/index.js"),
};

// html变量注入
export const htmlPluginModule = (mode) =>
  createHtmlPlugin({
    inject: {
      data: {
        title: loadEnv(mode, process.cwd()).VITE_APP_TITLE,
      },
    },
  });

// 打包压缩混淆配置
export const minifyModule = (mode, type = "esbuild") => {
  if (type === "esbuild") {
    // esbuild-简单压缩(打包构建更快)
    return {
      minify: "esbuild", // 打包压缩，
    };
  } else if (type === "terser") {
    // terser-可更详细配置压缩(可进行terserOptions配置)
    return {
      minify: "terser", // 打包压缩，
      terserOptions: {
        compress: {
          drop_console: true, // 删除console语句
          drop_debugger: true, // 删除debugger语句
        },
      },
    };
  }
  return {};
};

// 分包配置
export const manualChunksModule = (id) => {
  if (id.includes("node_modules")) {
    // 特定依赖单独打包, 其余打包在一起
    const arr = id.toString().split("node_modules/")[1].split("/");
    switch (arr[0]) {
      case "@vue":
      case "axios":
      case "element-plus":
      case "@element-plus": // 图标
        return "_" + arr[0];
      default:
        return "__vendor";
    }
  }
};

// 动态生成的代码块文件的名称和路径
export const chunkFileNamesModule = (chunkInfo) => {
  const facadeModuleId = chunkInfo.facadeModuleId
    ? chunkInfo.facadeModuleId.split("/")
    : [];
  const fileName = facadeModuleId[facadeModuleId.length - 2] || "[name]";
  return `js/${fileName}/[name].[hash].js`;
};
