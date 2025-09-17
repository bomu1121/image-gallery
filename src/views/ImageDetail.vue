<template>
  <div class="detail-wrapper">
    <div class="header">
      <el-button @click="goBack" size="large" class="back-button">
        返回
      </el-button>
      <el-button
        @click="removeImage"
        :disabled="!image"
        class="delete-icon-button"
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

        <!-- 标签区域 -->
        <div class="info-section-item">
          <h3 class="section-title">标签</h3>
          <div class="tags-container">
            <div class="tags-display">
              <!-- 现有标签 -->
              <div
                v-for="tag in image.tags"
                :key="tag"
                class="tag-item"
                @click="removeTag(tag)"
              >
                {{ tag }}
                <el-icon class="tag-remove"><Delete /></el-icon>
              </div>

              <!-- 添加标签按钮 -->
              <div
                v-if="!isAddingTag"
                class="add-tag-button"
                @click="startAddingTag"
              >
                <el-icon><Plus /></el-icon>
              </div>

              <!-- 正在添加的标签输入框 -->
              <div
                v-if="isAddingTag"
                class="tag-item adding-tag"
                :style="{ width: tagInputWidth + 'px' }"
              >
                <input
                  v-model="newTagInput"
                  ref="tagInput"
                  class="tag-input-field"
                  placeholder="输入标签"
                  @keyup.enter="confirmAddTag"
                  @keyup.escape="cancelAddTag"
                  @blur="confirmAddTag"
                  @input="adjustTagInputWidth"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from "vue";
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
  Plus,
} from "@element-plus/icons-vue";
import { getImageById, deleteImage, updateImage } from "@/utils/idb.js";
import { useDrawerNotification } from "@/composables/useDrawerNotification.js";

const route = useRoute();
const router = useRouter();
const image = ref(null);
const isEditingNotes = ref(false);
const editingNotes = ref("");
const notesInput = ref(null);
const newTagInput = ref("");
const tagInput = ref(null);
const isAddingTag = ref(false);
const tagInputWidth = ref(80); // 默认最小宽度
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
      objectUrl:
        data.blob && data.blob instanceof Blob
          ? URL.createObjectURL(data.blob)
          : data.url,
      // 确保tags字段存在
      tags: data.tags || [],
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

// 动态调整输入框宽度
function adjustTagInputWidth() {
  if (!tagInput.value) return;

  // 使用Canvas API来精确测量文本宽度
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  // 设置字体样式，与CSS中的样式保持一致
  context.font =
    '500 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

  const text = newTagInput.value || "输入标签";
  const textWidth = context.measureText(text).width;

  // 设置最小宽度80px，最大宽度200px，并加上一些padding
  tagInputWidth.value = Math.min(Math.max(textWidth + 24, 80), 200);
}

// 标签管理函数
function startAddingTag() {
  isAddingTag.value = true;
  newTagInput.value = "";
  tagInputWidth.value = 80; // 重置为默认宽度

  // 等待DOM更新后聚焦输入框
  setTimeout(() => {
    if (tagInput.value) {
      tagInput.value.focus();
    }
  }, 100);
}

function cancelAddTag() {
  isAddingTag.value = false;
  newTagInput.value = "";
}

async function confirmAddTag() {
  if (!newTagInput.value.trim()) {
    cancelAddTag();
    return;
  }

  if (!image.value) {
    cancelAddTag();
    return;
  }

  const tag = newTagInput.value.trim();

  // 检查标签是否已存在
  if (!image.value.tags) {
    image.value.tags = [];
  }

  if (image.value.tags.includes(tag)) {
    error("标签已存在");
    cancelAddTag();
    return;
  }

  try {
    // 先退出添加模式，避免状态混乱
    isAddingTag.value = false;

    // 添加标签到本地状态
    image.value.tags.push(tag);

    // 保存到数据库
    await updateImage(image.value.id, { tags: image.value.tags });

    success(`标签 "${tag}" 添加成功`);

    // 清空输入框
    newTagInput.value = "";
  } catch (err) {
    error("标签添加失败");
    // 恢复本地状态
    image.value.tags.pop();
    // 重新进入添加模式
    isAddingTag.value = true;
  }
}

async function removeTag(tagToRemove) {
  if (!image.value || !image.value.tags) return;

  try {
    // 从本地状态移除标签
    const index = image.value.tags.indexOf(tagToRemove);
    if (index > -1) {
      image.value.tags.splice(index, 1);
    }

    // 保存到数据库
    await updateImage(image.value.id, { tags: image.value.tags });

    success(`标签 "${tagToRemove}" 删除成功`);
  } catch (err) {
    error("标签删除失败");
    // 恢复本地状态
    image.value.tags.push(tagToRemove);
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

.delete-icon-button {
  background: transparent !important;
  border: none !important;
  color: #ff6b6b !important;
  transition: all 0.3s ease !important;
  width: 32px !important;
  height: 32px !important;
  padding: 0 !important;
  box-shadow: none !important;
}

.delete-icon-button:hover {
  color: #ff5252 !important;
}

.delete-icon-button:disabled {
  background: transparent !important;
  color: #c0c4cc !important;
  transform: none !important;
}

.delete-icon-button .el-icon {
  font-size: 18px !important;
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

/* 标签区域样式 */
.tags-container {
  position: relative;
}

.tags-display {
  min-height: 80px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 8px;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.tags-display:hover {
  background: rgba(255, 255, 255, 0.8);
}

.tag-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(102, 126, 234, 0.2);
}

.tag-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
}

.tag-remove {
  font-size: 12px;
  opacity: 0.8;
  transition: opacity 0.2s ease;
}

.tag-item:hover .tag-remove {
  opacity: 1;
}

.add-tag-section {
  margin-top: 8px;
}

.tag-input {
  width: 100%;
}

.tag-input :deep(.el-input__wrapper) {
  border-radius: 20px;
  border: 1px solid #e0e0e0;
  background: rgba(255, 255, 255, 0.8);
  transition: all 0.2s ease;
}

.tag-input :deep(.el-input__wrapper:hover) {
  border-color: #667eea;
}

.tag-input :deep(.el-input__wrapper.is-focus) {
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
}

/* 添加标签按钮样式 */
.add-tag-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: rgba(102, 126, 234, 0.1);
  border: 2px dashed rgba(102, 126, 234, 0.3);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #667eea;
}

.add-tag-button:hover {
  background: rgba(102, 126, 234, 0.2);
  border-color: rgba(102, 126, 234, 0.5);
  transform: scale(1.05);
}

.add-tag-button .el-icon {
  font-size: 16px;
}

/* 正在添加的标签样式 */
.adding-tag {
  background: rgba(102, 126, 234, 0.1) !important;
  border: 2px solid #667eea !important;
  min-width: 80px;
  transition: width 0.2s ease;
}

.tag-input-field {
  background: transparent;
  border: none;
  outline: none;
  color: #2c3e50;
  font-size: 13px;
  font-weight: 500;
  width: 100%;
  padding: 0;
  margin: 0;
}

.tag-input-field::placeholder {
  color: #8a9ba8;
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

  .tags-display {
    min-height: 60px;
    padding: 12px;
  }

  .tag-item {
    font-size: 12px;
    padding: 4px 8px;
  }

  .existing-tags {
    gap: 6px;
    margin-bottom: 8px;
  }

  .add-tag-button {
    width: 28px;
    height: 28px;
  }

  .add-tag-button .el-icon {
    font-size: 14px;
  }

  .adding-tag {
    min-width: 60px;
    transition: width 0.2s ease;
  }

  .tag-input-field {
    font-size: 12px;
  }
}
</style>
