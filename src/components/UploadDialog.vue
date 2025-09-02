<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    title="上传图片"
    width="500px"
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
    </el-upload>
  </el-dialog>
</template>

<script setup>
import { ElUpload, ElIcon, ElDialog } from "element-plus";
import { Upload as IconUpload } from "@element-plus/icons-vue";

const props = defineProps({
  visible: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits(["update:visible", "fileChange"]);

const onFileChange = (file) => {
  emit("fileChange", file);
};
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
</style>
