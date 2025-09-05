<template>
  <div class="detail-wrapper">
    <div class="header">
      <el-button @click="goBack" icon="ArrowLeft" size="large">返回</el-button>
      <h2>{{ image?.name || "图片详情" }}</h2>
      <el-button
        type="danger"
        @click="removeImage"
        :disabled="!image"
        size="large"
        >删除</el-button
      >
    </div>

    <div v-if="!image" class="empty">
      <el-empty description="图片不存在" />
    </div>

    <div v-else class="content">
      <!-- 左侧图片区域 -->
      <div class="image-section">
        <div class="image-container">
          <img
            :src="image.objectUrl || image.url"
            :alt="image.name"
            @click="openViewer"
          />
        </div>
      </div>

      <!-- 右侧信息区域 -->
      <div class="info-section">
        <!-- 基本信息 -->
        <div class="info-card">
          <h3>基本信息</h3>
          <div class="info-item">
            <span class="label">文件名：</span>
            <span class="value">{{ image.name }}</span>
          </div>
          <div class="info-item">
            <span class="label">文件类型：</span>
            <span class="value">{{ image.type || "未知" }}</span>
          </div>
          <div class="info-item">
            <span class="label">文件大小：</span>
            <span class="value">{{ formatFileSize(image.size) }}</span>
          </div>
          <div class="info-item">
            <span class="label">上传时间：</span>
            <span class="value">{{ formatDate(image.id) }}</span>
          </div>
        </div>

        <!-- 备注区域 -->
        <div class="info-card">
          <h3>备注</h3>
          <el-input
            v-model="image.notes"
            type="textarea"
            :rows="6"
            placeholder="添加图片备注..."
            @blur="saveNotes"
          />
          <div class="notes-tip">点击输入框外部自动保存</div>
        </div>

        <!-- 操作按钮 -->
        <div class="action-buttons">
          <el-button type="primary" @click="openViewer" size="large" block>
            <el-icon><icon-view /></el-icon>
            查看大图
          </el-button>
        </div>
      </div>
    </div>
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
} from "element-plus";
import { ArrowLeft, View as IconView } from "@element-plus/icons-vue";
import { getImageById, deleteImage, updateImage } from "@/utils/idb.js";

const route = useRoute();
const router = useRouter();
const image = ref(null);

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
  if (!image.value) return;
  const src = image.value.objectUrl || image.value.url;
  if (src) {
    window.open(src, "_blank");
  }
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

async function saveNotes() {
  if (!image.value) return;

  try {
    await updateImage(image.value.id, { notes: image.value.notes || "" });
    ElMessage.success("备注保存成功");
  } catch (error) {
    ElMessage.error("备注保存失败");
  }
}
</script>

<style scoped>
.detail-wrapper {
  padding: 16px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  margin-left: 60px;
}

.header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.header h2 {
  margin: 0;
  flex: 1;
  font-size: 20px;
  color: #333;
  font-weight: 500;
}

.header .el-button {
  border: 1px solid #dcdfe6;
  background: #fff;
  color: #606266;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
  min-height: 0;
}

/* 左侧图片区域 */
.image-section {
  width: 100%;
  min-width: 0;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.image-container {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  border-radius: 8px;
  overflow: hidden;
}

.image-container img {
  width: 100%;
  height: auto;
  object-fit: contain;
  cursor: pointer;
}

/* 右侧信息区域 */
.info-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-card {
  background: #fff;
  border-radius: 8px;
  padding: 12px;
  border: 1px solid #ebeef5;
}

.info-card h3 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #303133;
  font-weight: 600;
  border-bottom: 1px solid #f2f6fc;
  padding-bottom: 6px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f5f7fa;
}

.info-item:last-child {
  border-bottom: none;
}

.info-item .label {
  font-weight: 500;
  color: #606266;
  min-width: 72px;
}

.info-item .value {
  color: #303133;
  font-weight: 400;
  text-align: right;
  flex: 1;
  margin-left: 12px;
}

.notes-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 6px;
  text-align: center;
}

.action-buttons {
  margin-top: auto;
}

.action-buttons .el-button {
  height: 40px;
  font-size: 14px;
}

.empty {
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
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

/* 响应式 */
@media (max-width: 1200px) {
  .content {
    flex-direction: column;
  }

  .info-section {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .detail-wrapper {
    padding: 12px;
  }

  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    margin-bottom: 12px;
  }

  .header h2 {
    font-size: 18px;
  }

  .info-card {
    padding: 10px;
  }
}
</style>
