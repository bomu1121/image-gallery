<template>
  <div
    v-if="backgroundImage"
    class="global-background"
    :style="backgroundStyle"
  ></div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";

// 背景设置相关
const backgroundImage = ref(null);
const backgroundOpacity = ref(0.3);

// 背景样式计算属性
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${backgroundImage.value})`,
  opacity: backgroundOpacity.value,
}));

// 加载背景设置
async function loadBackgroundSettings() {
  try {
    const { getBackground } = await import("@/utils/idb.js");
    const backgroundData = await getBackground();

    if (backgroundData && backgroundData.imageData) {
      // 如果存储的是 base64 数据，直接使用
      if (backgroundData.imageData.startsWith("data:")) {
        backgroundImage.value = backgroundData.imageData;
      } else {
        // 如果是旧的 URL 数据，尝试迁移
        backgroundImage.value = backgroundData.imageData;
      }
      backgroundOpacity.value = backgroundData.opacity || 0.3;
    } else {
      // 如果没有找到背景数据，尝试从 localStorage 迁移（兼容旧版本）
      const savedImage = localStorage.getItem("backgroundImage");
      const savedOpacity = localStorage.getItem("backgroundOpacity");

      if (savedImage) {
        backgroundImage.value = savedImage;
        backgroundOpacity.value = savedOpacity ? parseFloat(savedOpacity) : 0.3;
      } else {
        backgroundImage.value = null;
        backgroundOpacity.value = 0.3;
      }
    }
  } catch (error) {
    console.error("加载背景设置失败:", error);
    // 降级到 localStorage
    const savedImage = localStorage.getItem("backgroundImage");
    const savedOpacity = localStorage.getItem("backgroundOpacity");

    backgroundImage.value = savedImage || null;
    backgroundOpacity.value = savedOpacity ? parseFloat(savedOpacity) : 0.3;
  }
}

// 监听 localStorage 变化（兼容旧版本）
function handleStorageChange(e) {
  if (e.key === "backgroundImage" || e.key === "backgroundOpacity") {
    loadBackgroundSettings();
  }
}

onMounted(() => {
  loadBackgroundSettings();

  // 监听 localStorage 变化
  window.addEventListener("storage", handleStorageChange);

  // 监听自定义事件（用于同一页面内的通信）
  window.addEventListener("backgroundSettingsChanged", loadBackgroundSettings);
});
</script>

<style scoped>
.global-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  z-index: 1;
  pointer-events: none; /* 确保背景不会阻挡用户交互 */
}
</style>
