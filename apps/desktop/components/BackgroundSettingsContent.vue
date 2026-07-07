<template>
  <div class="background-settings-content">
    <div class="setting-section">
      <!-- 上传区域 -->
      <div v-if="!backgroundImage" class="background-upload">
        <el-upload
          class="background-uploader"
          drag
          :auto-upload="false"
          :show-file-list="false"
          accept="image/*"
          :on-change="onBackgroundChange"
        >
          <div class="upload-placeholder">
            <el-icon class="el-icon--upload"><icon-plus /></el-icon>
            <div class="el-upload__text">拖拽背景图片到此处，或点击选择</div>
          </div>
        </el-upload>
      </div>

      <!-- 背景预览区域 -->
      <div v-else class="background-preview-section">
        <div
          class="background-preview"
          :style="{
            backgroundImage: `url(${backgroundImage})`,
            opacity: backgroundOpacity,
          }"
        ></div>
        <div class="background-actions">
          <el-button type="danger" size="small" @click="removeBackground">
            移除图片
          </el-button>
          <el-button type="primary" size="small" @click="triggerReupload">
            重新上传
          </el-button>
        </div>
        <!-- 隐藏的文件输入 -->
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          style="display: none"
          @change="onFileInputChange"
        />
      </div>

      <div v-if="backgroundImage" class="opacity-control">
        <label>背景透明度：{{ Math.round(backgroundOpacity * 100) }}%</label>
        <el-slider
          :model-value="backgroundOpacity"
          @update:model-value="onOpacityChange"
          :min="0.1"
          :max="1"
          :step="0.1"
          show-input
          input-size="small"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { ElUpload, ElIcon, ElButton, ElSlider } from "element-plus";
import { Plus as IconPlus } from "@element-plus/icons-vue";
import { useDrawerNotification } from "@/composables/useDrawerNotification.js";

const props = defineProps({
  backgroundImage: {
    type: String,
    default: null,
  },
  backgroundOpacity: {
    type: Number,
    default: 0.3,
  },
});

const emit = defineEmits([
  "backgroundChange",
  "opacityChange",
  "removeBackground",
]);

const { success, error } = useDrawerNotification();
const fileInput = ref(null);

const onBackgroundChange = (file) => {
  emit("backgroundChange", file);
};

const onOpacityChange = (value) => {
  emit("opacityChange", value);
};

const removeBackground = () => {
  emit("removeBackground");
  success("背景图片已移除");
};

const triggerReupload = () => {
  // 触发文件选择对话框
  if (fileInput.value) {
    fileInput.value.click();
  }
};

const onFileInputChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    emit("backgroundChange", file);
    success("背景图片已更新");
  }
  // 清空input值，允许重复选择同一文件
  event.target.value = "";
};
</script>

<style scoped>
.background-settings-content {
  padding: 0;
}

.setting-section {
  margin-bottom: 24px;
}

.background-upload {
  margin-bottom: 20px;
}

.background-uploader {
  border: 2px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
  width: 100%;
  height: 120px; /* 固定高度 */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #fafafa;
}

.background-uploader:hover {
  border-color: rgba(0, 0, 0, 0.3);
  background: rgba(0, 0, 0, 0.05);
}

/* 覆盖 el-upload 的默认样式 */
.background-uploader :deep(.el-upload-dragger) {
  border: none;
  background: transparent;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.background-uploader :deep(.el-upload-dragger:hover) {
  border: none;
  background: transparent;
}

.upload-placeholder {
  padding: 0;
  text-align: center;
  color: #666;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

/* 调整上传图标大小 */
.background-uploader :deep(.el-icon--upload) {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.5);
  margin-bottom: 8px;
}

.background-uploader :deep(.el-upload__text) {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.5);
  margin-bottom: 4px;
}

/* 背景预览区域 */
.background-preview-section {
  margin-bottom: 20px;
}

.background-preview {
  position: relative;
  width: 50vw; /* 使用视口宽度 */
  height: 50vh; /* 使用视口高度 */
  max-width: 100%; /* 确保不超过容器宽度 */

  margin: 0 auto; /* 居中显示 */
  overflow: hidden;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
}

.background-preview {
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.background-preview img {
  display: none; /* 隐藏img标签，使用background-image */
}

/* 按钮操作区域 */
.background-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  justify-content: center;
}

.opacity-control {
  margin-top: 16px;
}

.opacity-control label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: 500;
}
</style>
