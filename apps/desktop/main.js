import { createApp } from "vue";

// === Tauri native drag-drop support ===
import { getCurrentWindow } from "@tauri-apps/api/window";

(async function() {
  try {
    const appWindow = getCurrentWindow();
    appWindow.onDragDropEvent(async function(event) {
      console.log("[drag:tauri] event type:", event.payload.type);
      if (event.payload.type === "drop") {
        var paths = event.payload.paths;
        console.log("[drag:tauri] drop received", paths.length, "files:", paths);
        
        // Read files via Tauri fs plugin
        var { readFile } = await import("@tauri-apps/plugin-fs");
        for (var i = 0; i < paths.length; i++) {
          try {
            var fileData = await readFile(paths[i]);
            var fileName = paths[i].split("\\").pop().split("/").pop();
            var blob = new Blob([fileData]);
            console.log("[drag:tauri] loaded:", fileName, blob.size, "bytes");
            
            document.dispatchEvent(new CustomEvent("globalImageDrop", {
              detail: [{ name: fileName, blob: blob, path: paths[i] }]
            }));
          } catch(err) {
            console.error("[drag:tauri] failed to read", paths[i], err);
          }
        }
      }
    });
    console.log("[drag:main] Tauri drag-drop listener installed");
  } catch(e) {
    console.log("[drag:main] Not in Tauri, Tauri drag API unavailable:", e.message);
  }
})();


// UI 组件
import ElementPlus from "element-plus";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";
import "element-plus/dist/index.css";

// 全局样式
import "@/style/global.css";

// 全局组件
import { setGlobalComponents } from "@/components/global.js";

// 语言
import i18n from "@/plugin/language/index.js";

// 路由
import router from "@/router";

// store
import { createPinia } from "pinia";

// 自定义指令
import { initDirectives } from "@/plugin/directives/index.js";

// 页面
import App from "@/App.vue";

const app = createApp(App);
app.use(i18n);
app.use(ElementPlus);
app.use(router);
app.use(createPinia());


// === Global drag-and-drop support ===
(function() {
  // Use capture phase on window to catch events before anything else
  window.addEventListener("dragenter", function(e) {
    console.log("[drag:main] dragenter", e.target.tagName);
  }, true);
  window.addEventListener("dragover", function(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, true);
  window.addEventListener("drop", function(e) {
    e.preventDefault();
    var files = e.dataTransfer && e.dataTransfer.files;
    console.log("[drag:main] drop on window", files ? files.length : 0, "files");
    if (files && files.length > 0) {
      document.dispatchEvent(new CustomEvent("globalImageDrop", { detail: files }));
    }
  }, true);
  
  
  
  console.log("[drag:main] global drag-drop listeners installed");
})();


app.mount("#app");

// 注册全局 element ui 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(`Icon-${key}`, component);
}
// 注册全局组件
setGlobalComponents(app);
// 初始化自定义指令
initDirectives(app);
