<template>
  <div class="sidebar">
    <div class="sidebar-top">
      <div
        class="sidebar-item"
        :class="{ active: active === 'home' }"
        @click="$emit('goHome')"
        title="????"
      >
        <el-icon><icon-home /></el-icon>
      </div>
    </div>

    <div class="sidebar-bottom">
      <div
        class="sidebar-item"
        :class="{ active: active === 'overlay' }"
        @click="handleOverlayClick"
        title="????"
      >
        <el-icon><icon-copy-document /></el-icon>
      </div>
      <div
        class="sidebar-item"
        :class="{ active: active === 'trash' }"
        @click="handleTrashClick"
        title="???"
      >
        <el-icon><icon-delete /></el-icon>
      </div>
      <div
        class="sidebar-item"
        :class="{ active: active === 'ai-analysis-logs' }"
        @click="handleAILogsClick"
        title="AI????"
      >
        <el-icon><icon-document /></el-icon>
      </div>
      <div
        class="sidebar-item"
        :class="{ active: active === 'settings' }"
        @click="$emit('showSettings')"
        title="??"
      >
        <el-icon><icon-setting /></el-icon>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  Upload as IconUpload,
  Setting as IconSetting,
  Grid as IconHome,
  Document as IconDocument,
  CopyDocument as IconCopyDocument,
  Delete as IconDelete,
} from "@element-plus/icons-vue";
import { useRouter } from "vue-router";

defineProps({
  active: {
    type: String,
    default: "home",
  },
});

const emit = defineEmits([
  "showUpload",
  "goHome",
  "showSettings",
  "showAIAnalysisLogs",
  "showTrash",
]);

const router = useRouter();

function handleOverlayClick() {
  router.push("/overlay");
}

function handleTrashClick() {
  emit("showTrash");
  router.push("/trash").catch((e) => console.error(e));
}

function handleAILogsClick() {
  emit("showAIAnalysisLogs");
  router.push("/ai-analysis-logs").catch((e) => console.error(e));
}
</script>

<style scoped>
.sidebar {
  width: 60px;
  background: rgba(245, 245, 245, 0.9);
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 0;
  gap: 8px;
  position: relative;
  z-index: 10;
}

.sidebar-top {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.sidebar-bottom {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.sidebar-item {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #666;
}

.sidebar-item:hover {
  background: #e0e0e0;
  color: #333;
}

.sidebar-item.active {
  background: #e0e0e0;
  color: #333;
}
</style>