<template>
  <div class="background-settings-content">
    <div class="setting-section">
      <div class="background-upload">
        <el-upload
          class="background-uploader"
          drag
          :auto-upload="false"
          :show-file-list="false"
          accept="image/*"
          :on-change="onBackgroundChange"
        >
          <div v-if="!backgroundImage" class="upload-placeholder">
            <el-icon class="el-icon--upload"><icon-upload /></el-icon>
            <div class="el-upload__text">拖拽背景图片到此处，或点击选择</div>
          </div>
          <div v-else class="background-preview">
            <img :src="backgroundImage" alt="背景预览" />
            <div class="background-overlay">
              <el-button type="danger" size="small" @click="removeBackground">
                移除背景
              </el-button>
            </div>
          </div>
        </el-upload>
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
import { ElUpload, ElIcon, ElButton, ElSlider } from "element-plus";
import { Upload as IconUpload } from "@element-plus/icons-vue";

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

const onBackgroundChange = (file) => {
  emit("backgroundChange", file);
};

const onOpacityChange = (value) => {
  emit("opacityChange", value);
};

const removeBackground = () => {
  emit("removeBackground");
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
  transition: border-color 0.3s;
}

.background-uploader:hover {
  border-color: #409eff;
}

.upload-placeholder {
  padding: 40px 20px;
  text-align: center;
  color: #666;
}

.background-preview {
  position: relative;
  height: 200px;
  overflow: hidden;
  border-radius: 6px;
}

.background-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.background-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.background-preview:hover .background-overlay {
  opacity: 1;
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
