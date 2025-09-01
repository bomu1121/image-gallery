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

    <el-dialog
      v-model="viewerVisible"
      :title="image?.name || '预览'"
      width="90%"
      :close-on-click-modal="false"
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
import { ArrowLeft, View as IconView } from "@element-plus/icons-vue";
import { getImageById, deleteImage, updateImage } from "@/utils/idb.js";

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
  padding: 20px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 32px;
  padding: 24px 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.15);
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
}

.header::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.05) 100%
  );
  pointer-events: none;
}

.header h2 {
  margin: 0;
  flex: 1;
  font-size: 28px;
  color: white;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  letter-spacing: 0.5px;
}

/* 自定义滚动条样式 */
.detail-wrapper::-webkit-scrollbar {
  width: 8px;
}

.detail-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.detail-wrapper::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.detail-wrapper::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.content {
  display: flex;
  gap: 24px;
  margin-top: 20px;
  flex: 1;
  min-height: 0;
}

/* 左侧图片区域 */
.image-section {
  width: 600px;
  flex-shrink: 0;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.image-container {
  width: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  border-radius: 12px;
  overflow: hidden;
  background: #f8f9fa;
  border: 2px solid #e9ecef;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.image-container img {
  width: 100%;
  height: auto;
  object-fit: contain;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.image-container img:hover {
  transform: scale(1.05);
}

/* 右侧信息区域 */
.info-section {
  width: 380px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex-shrink: 0;
}

.info-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e9ecef;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.info-card h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: #333;
  font-weight: 600;
  border-bottom: 2px solid #007bff;
  padding-bottom: 8px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-item:last-child {
  border-bottom: none;
}

.info-item .label {
  font-weight: 500;
  color: #666;
  min-width: 80px;
}

.info-item .value {
  color: #333;
  font-weight: 400;
  text-align: right;
  flex: 1;
  margin-left: 16px;
}

.notes-tip {
  font-size: 12px;
  color: #999;
  margin-top: 8px;
  text-align: center;
}

.action-buttons {
  margin-top: auto;
}

.action-buttons .el-button {
  height: 48px;
  font-size: 16px;
}

/* 头部按钮特殊样式 */
.header .el-button {
  position: relative;
  z-index: 1;
  border: 2px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  color: white;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.header .el-button:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.header .el-button:active {
  transform: translateY(0);
}

/* 返回按钮特殊样式 */
.header .el-button:first-child {
  background: rgba(255, 255, 255, 0.15);
}

/* 删除按钮特殊样式 */
.header .el-button[type="danger"] {
  background: rgba(220, 53, 69, 0.8);
  border-color: rgba(220, 53, 69, 0.6);
}

.header .el-button[type="danger"]:hover {
  background: rgba(220, 53, 69, 0.9);
  border-color: rgba(220, 53, 69, 0.8);
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

/* 响应式设计 */
@media (max-width: 1200px) {
  .content {
    flex-direction: column;
  }

  .info-section {
    width: 100%;
  }

  .image-section {
    width: 100%;
    max-width: 600px;
  }
}

@media (max-width: 768px) {
  .detail-wrapper {
    padding: 16px;
    height: 100vh;
    overflow-y: auto;
  }

  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
    padding: 20px 24px;
    margin-bottom: 24px;
  }

  .header h2 {
    font-size: 22px;
  }

  .info-card {
    padding: 16px;
  }
}
</style>
