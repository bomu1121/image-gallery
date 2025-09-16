<template>
  <div class="detail-wrapper">
    <div class="header">
      <el-button @click="goBack" size="large" class="back-button">
        返回
      </el-button>
      <el-button
        type="danger"
        @click="removeImage"
        :disabled="!image"
        size="large"
        class="delete-button"
        circle
      >
        <el-icon><Delete /></el-icon>
      </el-button>
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
        <div class="info-section-item">
          <h3 class="section-title">基本信息</h3>
          <div class="info-grid">
            <div class="info-row">
              <span class="info-label">文件名</span>
              <span class="info-value">{{ image.name }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">文件类型</span>
              <span class="info-value">{{ image.type || "未知" }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">文件大小</span>
              <span class="info-value">{{ formatFileSize(image.size) }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">上传时间</span>
              <span class="info-value">{{ formatDate(image.id) }}</span>
            </div>
          </div>
        </div>

        <!-- 备注区域 -->
        <div class="info-section-item">
          <h3 class="section-title">备注</h3>
          <div class="notes-container">
            <!-- 显示模式 -->
            <div
              v-if="!isEditingNotes"
              class="notes-display"
              @click="startEditNotes"
            >
              <div v-if="image.notes" class="notes-content">
                {{ image.notes }}
              </div>
              <div v-else class="notes-placeholder">
                <span class="placeholder-text">点击添加图片备注...</span>
                <el-icon class="edit-icon"><Edit /></el-icon>
              </div>
            </div>

            <!-- 编辑模式 -->
            <div v-else class="notes-edit">
              <el-input
                v-model="editingNotes"
                type="textarea"
                :rows="6"
                placeholder="添加图片备注..."
                @blur="saveNotes"
                @keydown.escape="cancelEditNotes"
                ref="notesInput"
                class="notes-input"
              />
            </div>
          </div>
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
  ElInput,
  ElIcon,
  ElMessageBox,
} from "element-plus";
import {
  ArrowLeft,
  View as IconView,
  Edit,
  Delete,
} from "@element-plus/icons-vue";
import { getImageById, deleteImage, updateImage } from "@/utils/idb.js";
import { useDrawerNotification } from "@/composables/useDrawerNotification.js";

const route = useRoute();
const router = useRouter();
const image = ref(null);
const isEditingNotes = ref(false);
const editingNotes = ref("");
const notesInput = ref(null);
const { success, error } = useDrawerNotification();

function revokeObjectUrl(img) {
  if (img && img.objectUrl) {
    URL.revokeObjectURL(img.objectUrl);
  }
}

async function loadImage() {
  const imageId = route.params.id;
  if (!imageId) {
    error("图片ID不存在");
    return;
  }

  try {
    const data = await getImageById(parseInt(imageId));
    if (!data) {
      error("图片不存在");
      return;
    }

    revokeObjectUrl(image.value);
    image.value = {
      ...data,
      objectUrl: data.blob ? URL.createObjectURL(data.blob) : data.url,
    };
  } catch (err) {
    error("加载图片失败");
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
    await ElMessageBox.confirm(
      `确定要删除图片 "${image.value.name}" 吗？`,
      "删除确认",
      {
        confirmButtonText: "确定删除",
        cancelButtonText: "取消",
        type: "warning",
        confirmButtonClass: "el-button--danger",
      }
    );

    await deleteImage(image.value.id);
    success("删除成功");
    goBack();
  } catch (err) {
    if (err === "cancel") {
      // 用户取消删除，不显示错误信息
      return;
    }
    error("删除失败");
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

function startEditNotes() {
  isEditingNotes.value = true;
  editingNotes.value = image.value?.notes || "";
  // 等待DOM更新后聚焦输入框
  setTimeout(() => {
    if (notesInput.value) {
      notesInput.value.focus();
    }
  }, 100);
}

function cancelEditNotes() {
  isEditingNotes.value = false;
  editingNotes.value = "";
}

async function saveNotes() {
  if (!image.value) return;

  try {
    image.value.notes = editingNotes.value;
    await updateImage(image.value.id, { notes: editingNotes.value || "" });
    isEditingNotes.value = false;
    editingNotes.value = "";
  } catch (err) {
    error("备注保存失败");
    // 保存失败时不退出编辑模式，让用户可以重试
  }
}
</script>

<style scoped>
.detail-wrapper {
  padding: 24px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.back-button {
  border: 1px solid #dcdfe6;
  background: #fff;
  color: #606266;
  transition: all 0.3s ease;
  border-radius: 8px;
  font-weight: 500;
}

.back-button:hover {
  background: #f5f7fa;
  border-color: #c0c4cc;
  transform: translateX(-2px);
}

.delete-button {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
  border: none;
  color: #fff;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  width: 40px;
  height: 40px;
  padding: 0;
}

.delete-button:hover {
  background: linear-gradient(135deg, #ff5252 0%, #e53935 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.delete-button:disabled {
  background: #f5f5f5;
  color: #c0c4cc;
  transform: none;
  box-shadow: none;
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
  max-width: 700px;
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
  gap: 32px;
  padding: 24px 0;
}

.info-section-item {
  position: relative;
}

.section-title {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #2c3e50;
  font-weight: 600;
  position: relative;
  padding-left: 12px;
}

.section-title::before {
  content: "";
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 2px;
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.info-row:hover {
  background: rgba(102, 126, 234, 0.02);
  border-radius: 6px;
  padding-left: 8px;
  padding-right: 8px;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-weight: 500;
  color: #5a6c7d;
  font-size: 14px;
  min-width: 80px;
}

.info-value {
  color: #2c3e50;
  font-weight: 400;
  text-align: right;
  flex: 1;
  margin-left: 16px;
  font-size: 14px;
}

.notes-container {
  position: relative;
}

/* 显示模式样式 */
.notes-display {
  min-height: 120px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 8px;
  backdrop-filter: blur(10px);
  cursor: pointer;
  transition: all 0.3s ease;
}

.notes-display:hover {
  background: rgba(255, 255, 255, 0.8);
  transform: translateY(-1px);
}

.notes-content {
  color: #2c3e50;
  line-height: 1.6;
  font-size: 14px;
  white-space: pre-wrap;
  word-break: break-word;
}

.notes-placeholder {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #8a9ba8;
  font-size: 14px;
  min-height: 20px;
}

.placeholder-text {
  flex: 1;
}

.edit-icon {
  opacity: 0.6;
  transition: opacity 0.2s ease;
}

.notes-display:hover .edit-icon {
  opacity: 1;
}

/* 编辑模式样式 */
.notes-edit {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  padding: 16px;
}

.notes-input {
  border: none;
  background: transparent;
  resize: none;
}

.notes-input:focus {
  outline: none;
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
    margin-left: 0;
  }

  .header {
    margin-bottom: 16px;
    gap: 8px;
  }

  .back-button {
    font-size: 14px;
    padding: 8px 16px;
  }

  .delete-button {
    width: 36px;
    height: 36px;
    padding: 0;
  }

  .info-section {
    gap: 24px;
    padding: 16px 0;
  }

  .section-title {
    font-size: 15px;
    margin-bottom: 12px;
  }

  .info-grid {
    gap: 12px;
  }

  .info-row {
    padding: 10px 0;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .info-row:hover {
    padding: 10px 8px;
  }

  .info-label {
    min-width: auto;
    font-size: 13px;
    color: #6c7b8a;
  }

  .info-value {
    text-align: left;
    margin-left: 0;
    font-size: 13px;
    word-break: break-all;
  }

  .notes-display {
    min-height: 100px;
    padding: 12px;
  }

  .notes-content {
    font-size: 13px;
  }

  .notes-placeholder {
    font-size: 13px;
  }

  .notes-edit {
    padding: 12px;
  }

  .notes-input {
    font-size: 14px;
  }
}
</style>
