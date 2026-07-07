<template>
  <div class="personalization-settings">
    <div class="settings-section">
      <div class="section-header">
        <h4>图片展示设置</h4>
        <p>自定义图片画廊的展示方式</p>
      </div>

      <div class="settings-content">
        <!-- 列数设置 -->
        <div class="setting-item">
          <div class="setting-label">
            <span class="label-text">展示列数</span>
            <span class="label-desc">设置图片画廊的列数布局</span>
          </div>

          <div class="setting-control">
            <el-radio-group
              v-model="columnCount"
              @change="handleColumnCountChange"
              class="column-radio-group"
            >
              <el-radio-button :label="3">三列</el-radio-button>
              <el-radio-button :label="4">四列</el-radio-button>
              <el-radio-button :label="'auto'">自适应</el-radio-button>
            </el-radio-group>
          </div>
        </div>

        <!-- 预览区域 -->
        <div class="preview-section">
          <div class="preview-header">
            <span>预览效果</span>
          </div>
          <div class="preview-grid" :class="getPreviewGridClass()">
            <div class="preview-item" v-for="i in 8" :key="i">
              <div class="preview-placeholder"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";

// 定义事件
const emit = defineEmits(["columnCountChange"]);

// 响应式数据
const columnCount = ref(3); // 默认三列

// 处理列数变化
const handleColumnCountChange = (value) => {
  columnCount.value = value;
  emit("columnCountChange", value);

  // 保存到本地存储
  localStorage.setItem("imageGalleryColumnCount", JSON.stringify(value));
};

// 获取预览网格的CSS类
const getPreviewGridClass = () => {
  if (columnCount.value === "auto") {
    return "preview-auto";
  }
  return `preview-${columnCount.value}`;
};

// 初始化设置
onMounted(() => {
  // 从本地存储读取设置
  const savedColumnCount = localStorage.getItem("imageGalleryColumnCount");
  if (savedColumnCount) {
    try {
      const parsed = JSON.parse(savedColumnCount);
      columnCount.value = parsed;
    } catch (e) {
      console.warn("Failed to parse saved column count:", e);
    }
  }
});
</script>

<style scoped>
.personalization-settings {
  padding: 0;
}

.settings-section {
  margin-bottom: 32px;
}

.section-header {
  margin-bottom: 24px;
}

.section-header h4 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}

.section-header p {
  margin: 0;
  color: #666;
  font-size: 14px;
  line-height: 1.5;
}

.settings-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.setting-item {
  display: flex;
  align-items: flex-start;
  gap: 24px;
  padding: 20px;
  background: #fafafa;
  border-radius: 12px;
  border: 1px solid #e8e8e8;
  transition: all 0.2s ease;
}

.setting-item:hover {
  background: #f5f5f5;
  border-color: #d0d0d0;
}

.setting-label {
  flex: 1;
  min-width: 0;
}

.label-text {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.label-desc {
  display: block;
  font-size: 14px;
  color: #666;
  line-height: 1.4;
}

.setting-control {
  flex-shrink: 0;
}

.column-radio-group {
  display: flex;
  gap: 8px;
}

.column-radio-group :deep(.el-radio-button__inner) {
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 8px;
  border: 1px solid #d0d0d0;
  background: white;
  color: #666;
  transition: all 0.2s ease;
}

.column-radio-group :deep(.el-radio-button__inner:hover) {
  border-color: #409eff;
  color: #409eff;
}

.column-radio-group :deep(.el-radio-button.is-active .el-radio-button__inner) {
  background: #409eff;
  border-color: #409eff;
  color: white;
  box-shadow: 0 2px 4px rgba(64, 158, 255, 0.2);
}

.column-radio-group
  :deep(.el-radio-button:first-child .el-radio-button__inner) {
  border-radius: 8px;
}

.column-radio-group :deep(.el-radio-button:last-child .el-radio-button__inner) {
  border-radius: 8px;
}

/* 预览区域 */
.preview-section {
  margin-top: 8px;
}

.preview-header {
  margin-bottom: 16px;
}

.preview-header span {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.preview-grid {
  display: grid;
  gap: 12px;
  padding: 16px;
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  min-height: 200px;
}

/* 三列布局 */
.preview-3 {
  grid-template-columns: repeat(3, 1fr);
}

/* 四列布局 */
.preview-4 {
  grid-template-columns: repeat(4, 1fr);
}

/* 自适应布局 */
.preview-auto {
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
}

.preview-item {
  aspect-ratio: 1;
  border-radius: 6px;
  overflow: hidden;
}

.preview-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #f0f0f0 0%, #e0e0e0 100%);
  border: 1px solid #d0d0d0;
  border-radius: 6px;
  position: relative;
}

.preview-placeholder::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 20px;
  height: 20px;
  background: #ccc;
  border-radius: 2px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .setting-item {
    flex-direction: column;
    gap: 16px;
  }

  .column-radio-group {
    width: 100%;
    justify-content: center;
  }

  .preview-3,
  .preview-4 {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .preview-3,
  .preview-4,
  .preview-auto {
    grid-template-columns: 1fr;
  }
}
</style>
