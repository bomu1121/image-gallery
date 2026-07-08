import AutoImport from "unplugin-auto-import/vite";
import { createHtmlPlugin } from "vite-plugin-html";
import { loadEnv } from "vite";
import { resolve } from "path";

// 鑷姩寮曞叆
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

// 璺緞蹇嵎璁块棶鍒悕
export const resolveAliasModule = {
  "@": resolve(__dirname, "."),
  "@enum": resolve(__dirname, "src/plugin/enum/index.js"),
};

// html鍙橀噺娉ㄥ叆
export const htmlPluginModule = (mode) =>
  createHtmlPlugin({
    inject: {
      data: {
        title: loadEnv(mode, process.cwd()).VITE_APP_TITLE,
      },
    },
  });

// 鎵撳寘鍘嬬缉娣锋穯閰嶇疆
export const minifyModule = (mode, type = "esbuild") => {
  if (type === "esbuild") {
    // esbuild-绠€鍗曞帇缂?鎵撳寘鏋勫缓鏇村揩)
    return {
      minify: "esbuild", // 鎵撳寘鍘嬬缉锛?
    };
  } else if (type === "terser") {
    // terser-鍙洿璇︾粏閰嶇疆鍘嬬缉(鍙繘琛宼erserOptions閰嶇疆)
    return {
      minify: "terser", // 鎵撳寘鍘嬬缉锛?
      terserOptions: {
        compress: {
          drop_console: true, // 鍒犻櫎console璇彞
          drop_debugger: true, // 鍒犻櫎debugger璇彞
        },
      },
    };
  }
  return {};
};

// 鍒嗗寘閰嶇疆
export const manualChunksModule = (id) => {
  if (id.includes("node_modules")) {
    // 鐗瑰畾渚濊禆鍗曠嫭鎵撳寘, 鍏朵綑鎵撳寘鍦ㄤ竴璧?
    const arr = id.toString().split("node_modules/")[1].split("/");
    switch (arr[0]) {
      case "@vue":
      case "axios":
      case "element-plus":
      case "@element-plus": // 鍥炬爣
        return "_" + arr[0];
      default:
        return "__vendor";
    }
  }
};

// 鍔ㄦ€佺敓鎴愮殑浠ｇ爜鍧楁枃浠剁殑鍚嶇О鍜岃矾寰?
export const chunkFileNamesModule = (chunkInfo) => {
  const facadeModuleId = chunkInfo.facadeModuleId
    ? chunkInfo.facadeModuleId.split("/")
    : [];
  const fileName = facadeModuleId[facadeModuleId.length - 2] || "[name]";
  return `js/${fileName}/[name].[hash].js`;
};
