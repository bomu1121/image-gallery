<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    title="上传图片"
    width="500px"
    @opened="onDialogOpened"
    @closed="onDialogClosed"
  >
    <el-upload
      class="uploader"
      drag
      :auto-upload="false"
      :show-file-list="false"
      accept="image/*"
      :on-change="onFileChange"
    >
      <el-icon class="el-icon--upload"><icon-upload /></el-icon>
      <div class="el-upload__text">拖拽图片到此处，或点击选择</div>
      <div class="el-upload__tip">支持 Ctrl+V 粘贴图片</div>
    </el-upload>
  </el-dialog>
</template>

<script setup>
import { onBeforeUnmount } from "vue";
import { ElUpload, ElIcon, ElDialog, ElMessage } from "element-plus";
import { Upload as IconUpload } from "@element-plus/icons-vue";

const props = defineProps({
  visible: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits(["update:visible", "fileChange", "pasteImages"]);

const onFileChange = (file) => {
  emit("fileChange", file);
};

// 粘贴功能相关
let pasteEventCleanup = null;

const onDialogOpened = () => {
  // 对话框打开时，监听粘贴事件
  setupPasteEventListener();
};

const onDialogClosed = () => {
  // 对话框关闭时，清理事件监听器
  if (pasteEventCleanup) {
    pasteEventCleanup();
    pasteEventCleanup = null;
  }
};

const setupPasteEventListener = () => {
  const handlePasteEvent = (event) => {
    try {
      console.log("弹窗粘贴事件监听器被触发");
      const { processedImages } = event.detail;
      if (processedImages && processedImages.length > 0) {
        console.log(`弹窗处理 ${processedImages.length} 张图片`);
        // 通过emit将粘贴的图片传递给父组件处理
        emit("pasteImages", processedImages);

        // 关闭对话框
        emit("update:visible", false);
      }
    } catch (error) {
      console.error("处理粘贴事件时出错:", error);
      ElMessage.error("粘贴失败，请重试");
    }
  };

  // 监听自定义粘贴事件
  window.addEventListener("pasteImagesInDialog", handlePasteEvent);

  // 保存清理函数
  pasteEventCleanup = () => {
    window.removeEventListener("pasteImagesInDialog", handlePasteEvent);
  };
};

onBeforeUnmount(() => {
  // 组件卸载时清理
  if (pasteEventCleanup) {
    pasteEventCleanup();
  }
});
</script>

<style scoped>
.uploader {
  border: 2px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: border-color 0.3s;
}

.uploader:hover {
  border-color: #409eff;
}

.el-upload__tip {
  color: #999;
  font-size: 12px;
  margin-top: 8px;
}
</style>
