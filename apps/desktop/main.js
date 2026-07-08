import { createApp } from "vue";

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
  document.addEventListener("dragenter", function(e) {
    e.preventDefault();
    console.log("[drag:main] dragenter", e.target.tagName);
  });
  document.addEventListener("dragover", function(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  });
  document.addEventListener("dragleave", function(e) {
    console.log("[drag:main] dragleave", e.target.tagName);
  });
  
  document.addEventListener("drop", function(e) {
    e.preventDefault();
    var files = e.dataTransfer && e.dataTransfer.files;
    if (files && files.length > 0) {
      console.log("[drag:main] drop received", files.length, "files");
      // Dispatch custom event for Vue components to handle
      document.dispatchEvent(new CustomEvent("globalImageDrop", { detail: files }));
    }
  });
  
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
