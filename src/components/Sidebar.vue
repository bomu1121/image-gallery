<template>
  <div class="sidebar">
    <div class="sidebar-top">
      <div
        class="sidebar-item"
        @click="$emit('showUpload')"
        title="上传图片"
      >
        <el-icon><icon-upload /></el-icon>
      </div>

      <div class="sidebar-item" @click="$emit('goHome')" title="回到主页">
        <el-icon><icon-home /></el-icon>
      </div>

      <div
        class="sidebar-item"
        @click="$emit('showGroups')"
        title="分组管理"
      >
        <el-icon><icon-folder /></el-icon>
      </div>
    </div>

    <div class="sidebar-bottom">
      <div
        class="sidebar-item"
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
  Folder as IconFolder,
} from "@element-plus/icons-vue";

defineEmits(['showUpload', 'goHome', 'showGroups', 'showSettings']);
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
</style>
