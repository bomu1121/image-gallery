<template>
  <div class="sidebar">
    <div class="sidebar-top">
      <!-- <div
        class="sidebar-item upload"
        @click="$emit('showUpload')"
        title="上传图片"
      >
        <el-icon><icon-upload /></el-icon>
      </div> -->

      <div
        class="sidebar-item"
        :class="{ active: active === 'home' }"
        @click="$emit('goHome')"
        title="回到主页"
      >
        <el-icon><icon-home /></el-icon>
      </div>
    </div>

    <div class="sidebar-bottom">
      <div
        class="sidebar-item"
        :class="{ active: active === 'trash' }"
        @click="handleTrashClick"
        title="回收站"
      >
        <el-icon><icon-delete /></el-icon>
      </div>
      <div
        class="sidebar-item"
        :class="{ active: active === 'ai-analysis-logs' }"
        @click="handleAILogsClick"
        title="AI分析日志"
      >
        <el-icon><icon-document /></el-icon>
      </div>
      <div
        class="sidebar-item"
        :class="{ active: active === 'settings' }"
        @click="$emit('showSettings')"
        title="设置"
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

function handleTrashClick() {
  console.log("🗑️ 侧边栏回收站按钮被点击");
  console.log("📤 准备发射事件: showTrash");
  emit("showTrash");
  console.log("✅ 事件已发射");

  // 直接测试路由跳转
  console.log("🚀 直接测试路由跳转");
  router
    .push("/trash")
    .then(() => {
      console.log("✅ 直接路由跳转成功");
    })
    .catch((error) => {
      console.error("❌ 直接路由跳转失败:", error);
    });
}

function handleAILogsClick() {
  console.log("📋 侧边栏AI日志按钮被点击");
  console.log("📤 准备发射事件: showAIAnalysisLogs");
  emit("showAIAnalysisLogs");
  console.log("✅ 事件已发射");

  // 直接测试路由跳转
  console.log("🚀 直接测试路由跳转");
  router
    .push("/ai-analysis-logs")
    .then(() => {
      console.log("✅ 直接路由跳转成功");
    })
    .catch((error) => {
      console.error("❌ 直接路由跳转失败:", error);
    });
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

/* 区分上传按钮的样式（始终突出） */
.sidebar-item.upload {
  background: #f0f0f0;
  color: #666;
}
.sidebar-item.upload:hover {
  background: #e0e0e0;
  color: #333;
}

/* 批量删除按钮样式 */
.sidebar-item.batch-delete {
  background: #fef0f0;
  color: #f56c6c;
}
.sidebar-item.batch-delete:hover {
  background: #fde2e2;
  color: #f56c6c;
}

/* 其他按钮的选中态样式 */
.sidebar-item.active {
  background: #e0e0e0;
  color: #333;
}
</style>
