<template>
  <div class="settings-page">
    <div class="settings-content">
      <div class="setting-section">
        <div class="setting-item" @click="$emit('showBackgroundSettings')">
          <div class="setting-info">
            <el-icon class="setting-icon"><icon-picture /></el-icon>
            <div class="setting-text">
              <h3>背景设置</h3>
              <p>自定义应用背景图片和透明度</p>
            </div>
          </div>
          <el-icon class="setting-arrow"><icon-arrow-right /></el-icon>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  ArrowLeft as IconArrowLeft,
  ArrowRight as IconArrowRight,
  Picture as IconPicture,
} from "@element-plus/icons-vue";

defineEmits(["back", "showBackgroundSettings"]);
</script>

<style scoped>
.settings-page {
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
  height: 100%;
  overflow-y: auto;
}

.settings-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.settings-header h2 {
  margin: 0;
  color: #333;
  font-size: 24px;
  font-weight: 600;
}

.settings-content {
  padding: 20px 0;
}

.setting-section {
  margin-bottom: 24px;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
}

.setting-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
  transform: translateY(-1px);
}

.setting-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.setting-icon {
  font-size: 24px;
  color: #409eff;
  background: rgba(64, 158, 255, 0.1);
  padding: 12px;
  border-radius: 8px;
}

.setting-text h3 {
  margin: 0 0 4px 0;
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

.setting-text p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.setting-arrow {
  font-size: 16px;
  color: #999;
}
</style>
