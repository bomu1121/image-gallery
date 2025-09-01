<template>
  <div class="detail-wrapper">
    <div class="header">
      <el-button @click="goBack" icon="ArrowLeft">返回</el-button>
      <h2>{{ image?.name || "图片详情" }}</h2>
      <el-button type="danger" @click="removeImage" :disabled="!image"
        >删除</el-button
      >
    </div>

    <div v-if="!image" class="empty">
      <el-empty description="图片不存在" />
    </div>

    <div v-else class="content">
      <div class="image-container">
        <img
          :src="image.objectUrl || image.url"
          :alt="image.name"
          @click="openViewer"
        />
      </div>

      <div class="info">
        <el-descriptions title="图片信息" :column="1" border>
          <el-descriptions-item label="文件名">{{
            image.name
          }}</el-descriptions-item>
          <el-descriptions-item label="文件类型">{{
            image.type || "未知"
          }}</el-descriptions-item>
          <el-descriptions-item label="文件大小">{{
            formatFileSize(image.size)
          }}</el-descriptions-item>
          <el-descriptions-item label="上传时间">{{
            formatDate(image.id)
          }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </div>

    <el-dialog
      v-model="viewerVisible"
      :title="image?.name || '预览'"
      width="80%"
    >
      <div class="viewer">
        <img
          v-if="image"
          :src="image.objectUrl || image.url"
          :alt="image.name"
        />
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  ElButton,
  ElEmpty,
  ElDescriptions,
  ElDescriptionsItem,
  ElMessage,
  ElDialog,
} from "element-plus";
import { ArrowLeft } from "@element-plus/icons-vue";
import { getImageById, deleteImage } from "@/utils/idb.js";

const route = useRoute();
const router = useRouter();
const image = ref(null);
const viewerVisible = ref(false);

function revokeObjectUrl(img) {
  if (img && img.objectUrl) {
    URL.revokeObjectURL(img.objectUrl);
  }
}

async function loadImage() {
  const imageId = route.params.id;
  if (!imageId) {
    ElMessage.error("图片ID不存在");
    return;
  }

  try {
    const data = await getImageById(parseInt(imageId));
    if (!data) {
      ElMessage.error("图片不存在");
      return;
    }

    revokeObjectUrl(image.value);
    image.value = {
      ...data,
      objectUrl: data.blob ? URL.createObjectURL(data.blob) : data.url,
    };
  } catch (error) {
    ElMessage.error("加载图片失败");
  }
}

onMounted(loadImage);
onBeforeUnmount(() => revokeObjectUrl(image.value));

function goBack() {
  router.push("/gallery");
}

async function removeImage() {
  if (!image.value) return;

  try {
    await deleteImage(image.value.id);
    ElMessage.success("删除成功");
    goBack();
  } catch (error) {
    ElMessage.error("删除失败");
  }
}

function openViewer() {
  viewerVisible.value = true;
}

function formatFileSize(bytes) {
  if (!bytes) return "未知";
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
}

function formatDate(timestamp) {
  if (!timestamp) return "未知";
  return new Date(timestamp).toLocaleString("zh-CN");
}
</script>

<style scoped>
.detail-wrapper {
  padding: 16px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #eee;
}

.header h2 {
  margin: 0;
  flex: 1;
}

.content {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 24px;
}

.image-container {
  border: 1px solid #eee;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}

.image-container img {
  width: 100%;
  height: auto;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.image-container img:hover {
  transform: scale(1.02);
}

.info {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #eee;
}

.empty {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.viewer {
  width: 100%;
  max-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.viewer img {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
}

@media (max-width: 768px) {
  .content {
    grid-template-columns: 1fr;
  }

  .header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
