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
function loadBackgroundSettings() {
  const savedImage = localStorage.getItem("backgroundImage");
  const savedOpacity = localStorage.getItem("backgroundOpacity");

  // 明确设置背景图片，如果没有则设为 null
  backgroundImage.value = savedImage || null;

  if (savedOpacity) {
    backgroundOpacity.value = parseFloat(savedOpacity);
  } else {
    backgroundOpacity.value = 0.3; // 默认透明度
  }
}

// 监听 localStorage 变化
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
