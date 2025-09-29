<template>
  <div class="detail-wrapper">
    <!-- 固定顶部栏（只覆盖主内容区域，避开60px侧边栏） -->
    <div class="fixed-header" ref="headerRef">
      <div class="header-content">
        <div @click="goBack" class="back-icon-button">
          <el-icon><ArrowLeft /></el-icon>
        </div>
        <div class="header-actions">
          <div
            @click="toggleInfoMode"
            :class="{ active: showInfoPanel }"
            class="info-button"
            title="查看信息"
          >
            <img
              src="/src/static/images/icons/info.png"
              alt="信息"
              class="info-icon"
            />
          </div>
          <div @click="restoreImage" class="restore-button" title="恢复图片">
            <el-icon><Refresh /></el-icon>
          </div>
          <div
            @click="permanentlyDeleteImage"
            class="delete-icon-button"
            title="永久删除"
          >
            <el-icon><Delete /></el-icon>
          </div>
        </div>
      </div>
    </div>

    <!-- 内容滚动区域，避免被固定栏遮挡 -->
    <div class="content-wrapper">
      <div v-if="!image" class="empty">
        <el-empty description="图片不存在" />
      </div>

      <div v-else class="content">
        <!-- 图片区域 -->
        <div class="image-section">
          <!-- 信息管理panel -->
          <div v-if="showInfoPanel" class="info-panel">
            <div class="panel-content">
              <div class="info-panel-header">
                <h3 class="panel-title">图片信息</h3>
              </div>

              <!-- 基本信息 -->
              <div class="info-section-compact">
                <h4 class="section-title-compact">基本信息</h4>
                <div class="info-grid-compact">
                  <div class="info-row-compact">
                    <span class="info-label-compact">文件名</span>
                    <span class="info-value-compact">{{ image.name }}</span>
                  </div>
                  <div class="info-row-compact">
                    <span class="info-label-compact">文件类型</span>
                    <span class="info-value-compact">{{
                      image.type || "未知"
                    }}</span>
                  </div>
                  <div class="info-row-compact">
                    <span class="info-label-compact">文件大小</span>
                    <span class="info-value-compact">{{
                      formatFileSize(image.size)
                    }}</span>
                  </div>
                  <div class="info-row-compact">
                    <span class="info-label-compact">删除时间</span>
                    <span class="info-value-compact">{{
                      formatDate(image.deletedAt)
                    }}</span>
                  </div>
                </div>
              </div>

              <!-- 标签显示区域（只读） -->
              <div
                v-if="image.tags && image.tags.length > 0"
                class="tags-section-compact"
              >
                <h4 class="section-title-compact">标签</h4>
                <div class="tags-display-readonly">
                  <div
                    v-for="tag in image.tags"
                    :key="tag"
                    class="tag-item-readonly"
                  >
                    {{ tag }}
                  </div>
                </div>
              </div>

              <!-- 备注显示区域（只读） -->
              <div v-if="image.notes" class="notes-section-compact">
                <h4 class="section-title-compact">备注</h4>
                <div class="notes-display-readonly">
                  {{ image.notes }}
                </div>
              </div>
            </div>
          </div>

          <div
            class="image-viewport"
            :style="{ height: imageAreaHeight + 'px' }"
          >
            <div class="image-container">
              <img
                :src="image.objectUrl || image.url"
                :alt="image.name"
                @click="openViewer"
              />
            </div>
          </div>
          <!-- 组图轮播条（仅当存在组图时显示） -->
          <ThumbnailCarousel
            v-if="childrenCount > 0"
            :items="allGroupImages"
            :current-index="currentImageIndex"
            :get-item-image="getThumbnailUrl"
            :get-item-alt="(img) => img.name"
            @item-click="switchToImage"
            class="group-carousel"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElButton, ElEmpty, ElIcon, ElMessageBox } from "element-plus";
import { ArrowLeft, Refresh, Delete } from "@element-plus/icons-vue";
import {
  getTrashImages,
  restoreImageFromTrash,
  permanentlyDeleteFromTrash,
} from "@/utils/idb.js";
import { useDrawerNotification } from "@/composables/useDrawerNotification.js";
import ThumbnailCarousel from "@/components/ThumbnailCarousel.vue";

const route = useRoute();
const router = useRouter();
const image = ref(null);
const headerRef = ref(null);
const children = ref([]);
const childrenCount = ref(0);
const allGroupImages = ref([]); // 包含主图和所有附图的数组
const currentImageIndex = ref(0); // 当前显示的图片索引
const { success, error } = useDrawerNotification();

// 信息面板相关状态
const showInfoPanel = ref(false);

// 计算图片展示区域高度（视口高度 - 顶部栏高度）
const imageAreaHeight = ref(0);

function computeImageAreaHeight() {
  const headerHeight = headerRef.value ? headerRef.value.offsetHeight : 0;
  const verticalPadding = 0;
  const viewport = window.innerHeight || document.documentElement.clientHeight;
  const height = Math.max(viewport - headerHeight - verticalPadding, 200);
  imageAreaHeight.value = height;
}

function onResize() {
  computeImageAreaHeight();
}

onMounted(() => {
  computeImageAreaHeight();
  window.addEventListener("resize", onResize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", onResize);
});

function revokeObjectUrl(img) {
  if (img && img.objectUrl) {
    URL.revokeObjectURL(img.objectUrl);
  }
}

async function loadImage() {
  const trashId = route.params.id;
  if (!trashId) {
    error("图片ID不存在");
    return;
  }

  try {
    // 从回收站获取所有图片
    const trashImages = await getTrashImages();
    let data = trashImages.find((img) => img.trashId == trashId);

    if (!data) {
      error("图片不存在");
      return;
    }

    // 若是附图，自动切换到其主图详情
    if (data.parentImageId !== null && data.parentImageId !== undefined) {
      const parent = trashImages.find(
        (img) => img.originalImageId === data.parentImageId
      );
      if (parent) data = parent;
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

    // 加载所有组图（主图 + 附图）
    try {
      // 找到所有属于这个组的图片
      const groupImages = trashImages.filter(
        (img) =>
          img.originalImageId === data.originalImageId ||
          img.parentImageId === data.originalImageId
      );

      childrenCount.value = groupImages.filter(
        (img) => img.parentImageId === data.originalImageId
      ).length;

      // 释放旧图片的 objectUrl 并将其在 allGroupImages 中置空
      allGroupImages.value.forEach((img) => {
        if (img.objectUrl && img.objectUrl.startsWith("blob:")) {
          URL.revokeObjectURL(img.objectUrl);
          img.objectUrl = null; // 关键：置空 objectUrl
        }
      });

      // 构建包含主图和附图的数组
      const normalizedChildren = groupImages
        .filter((img) => img.parentImageId === data.originalImageId)
        .map((child) => ({
          ...child,
          objectUrl:
            child.blob && child.blob instanceof Blob
              ? URL.createObjectURL(child.blob)
              : child.url,
        }));

      // 主图放在第一位，然后是附图
      allGroupImages.value = [image.value, ...normalizedChildren];
      currentImageIndex.value = 0; // 默认显示主图

      // 保持children数组用于兼容性
      children.value = normalizedChildren;
    } catch (e) {
      childrenCount.value = 0;
      allGroupImages.value = [image.value]; // 至少包含主图
      currentImageIndex.value = 0;
      children.value = [];
    }
  } catch (err) {
    error("加载图片失败");
  }
}

onMounted(loadImage);
onBeforeUnmount(() => {
  revokeObjectUrl(image.value);
  allGroupImages.value.forEach(
    (img) => img.objectUrl && URL.revokeObjectURL(img.objectUrl)
  );
});

function goBack() {
  router.push("/trash");
}

// 切换信息面板模式
function toggleInfoMode() {
  showInfoPanel.value = !showInfoPanel.value;
}

// 恢复图片
async function restoreImage() {
  if (!image.value) return;

  try {
    await ElMessageBox.confirm(
      `确定要恢复图片 "${image.value.name}" 吗？`,
      "恢复确认",
      {
        confirmButtonText: "确定恢复",
        cancelButtonText: "取消",
        type: "info",
        confirmButtonClass: "el-button--primary",
      }
    );

    await restoreImageFromTrash(image.value.trashId);
    success("恢复成功");
    goBack();
  } catch (err) {
    if (err === "cancel") {
      // 用户取消恢复，不显示错误信息
      return;
    }
    error("恢复失败");
  }
}

// 永久删除图片
async function permanentlyDeleteImage() {
  if (!image.value) return;

  try {
    await ElMessageBox.confirm(
      `确定要永久删除图片 "${image.value.name}" 吗？此操作不可撤销！`,
      "永久删除确认",
      {
        confirmButtonText: "确定删除",
        cancelButtonText: "取消",
        type: "warning",
        confirmButtonClass: "el-button--danger",
      }
    );

    await permanentlyDeleteFromTrash(image.value.trashId);
    success("永久删除成功");
    goBack();
  } catch (err) {
    if (err === "cancel") {
      // 用户取消删除，不显示错误信息
      return;
    }
    error("永久删除失败");
  }
}

function openViewer() {
  if (!image.value) return;
  const src = image.value.objectUrl || image.value.url;
  if (src) {
    window.open(src, "_blank");
  }
}

// 获取缩略图的URL
function getThumbnailUrl(img) {
  // 如果有有效的 objectUrl（blob URL），直接使用
  if (img.objectUrl && img.objectUrl.startsWith("blob:")) {
    return img.objectUrl;
  }

  // 如果没有 objectUrl 但有 blob 数据，创建新的 objectUrl
  if (!img.objectUrl && img.blob && img.blob instanceof Blob) {
    const newObjectUrl = URL.createObjectURL(img.blob);
    // 更新 allGroupImages 中的 objectUrl
    const index = allGroupImages.value.findIndex(
      (item) => item.trashId === img.trashId
    );
    if (index !== -1) {
      allGroupImages.value[index].objectUrl = newObjectUrl;
    }
    return newObjectUrl;
  }

  // 最后回退到原始 URL
  return img.url;
}

// 切换到指定索引的图片
function switchToImage(index) {
  if (index < 0 || index >= allGroupImages.value.length) return;

  currentImageIndex.value = index;
  const targetImage = allGroupImages.value[index];

  // 确保目标图片有有效的 objectUrl
  let targetObjectUrl = targetImage.objectUrl;
  if (
    !targetObjectUrl &&
    targetImage.blob &&
    targetImage.blob instanceof Blob
  ) {
    targetObjectUrl = URL.createObjectURL(targetImage.blob);
    // 更新 allGroupImages 中的 objectUrl，避免重复创建
    allGroupImages.value[index].objectUrl = targetObjectUrl;
  } else if (!targetObjectUrl) {
    targetObjectUrl = targetImage.url;
  }

  // 释放当前图片的 objectUrl 并在 allGroupImages 中置空
  if (
    image.value &&
    image.value.objectUrl &&
    image.value.objectUrl.startsWith("blob:")
  ) {
    URL.revokeObjectURL(image.value.objectUrl);
    // 在 allGroupImages 中找到对应的图片并置空其 objectUrl
    const currentIndex = allGroupImages.value.findIndex(
      (img) => img.trashId === image.value.trashId
    );
    if (currentIndex !== -1) {
      allGroupImages.value[currentIndex].objectUrl = null;
    }
  }

  // 更新当前显示的图片
  image.value = {
    ...targetImage,
    objectUrl: targetObjectUrl,
    tags: targetImage.tags || [],
  };
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
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 固定顶部栏 */
.fixed-header {
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  background: rgba(245, 245, 245, 0.9);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  max-width: 1200px;
  margin: 0 auto;
}

/* 内容区域 */
.content-wrapper {
  flex: 1;
  overflow-y: hidden;
  min-height: 0;
}

/* 返回图标按钮样式 */
.back-icon-button {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: #606266;
  transition: color 0.2s ease;
}

.back-icon-button:hover {
  color: #4e4f52;
}

.back-icon-button .el-icon {
  font-size: 20px;
}

.restore-button {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: #67c23a;
  transition: color 0.2s ease;
}

.restore-button:hover {
  color: #529b2e;
}

.restore-button .el-icon {
  font-size: 18px;
}

.delete-icon-button {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: #ff6b6b;
  transition: color 0.2s ease;
}

.delete-icon-button:hover {
  color: #e55a5a;
}

.delete-icon-button .el-icon {
  font-size: 18px;
}

.content {
  display: flex;
  flex: 1;
  min-height: 0;
}

/* 图片区域 */
.image-section {
  width: 100%;
  height: 100%;
  position: relative;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-viewport {
  width: 100%;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  overflow: hidden;
}

.image-container img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  cursor: pointer;
}

/* 组图轮播条样式 */
.group-carousel {
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
}

.empty {
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
}

/* 添加组图相关样式 */
.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.info-button {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.info-icon {
  width: 20px;
  height: 20px;
  transition: opacity 0.2s ease;
}

.info-button::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 20px;
  height: 20px;
  background-image: url("/src/static/images/icons/info-hover.png");
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.info-button:hover {
  background: rgba(102, 126, 234, 0.1);
}

.info-button.active {
  background: rgba(102, 126, 234, 0.2);
}

.info-button.active .info-icon {
  opacity: 0;
}

.info-button.active::after {
  opacity: 1;
}

/* 信息管理panel样式 */
.info-panel {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  z-index: 20;
  animation: slideDown 0.3s ease-out;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.info-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 0 16px;
}

.info-panel-header .panel-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

/* 紧凑的信息展示样式 */
.info-section-compact {
  margin-bottom: 20px;
  padding: 0 16px;
}

.section-title-compact {
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 12px 0;
  padding-left: 8px;
  border-left: 3px solid #667eea;
}

.info-grid-compact {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.info-row-compact {
  display: flex;
  flex-direction: column;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.info-label-compact {
  font-size: 11px;
  color: #8a9ba8;
  font-weight: 500;
  margin-bottom: 2px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value-compact {
  font-size: 13px;
  color: #2c3e50;
  font-weight: 500;
  word-break: break-word;
}

/* 标签显示区域（只读） */
.tags-section-compact {
  margin-bottom: 20px;
  padding: 0 16px;
}

.tags-display-readonly {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.tag-item-readonly {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(102, 126, 234, 0.2);
}

/* 备注显示区域（只读） */
.notes-section-compact {
  padding: 0 16px;
}

.notes-display-readonly {
  padding: 12px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  color: #2c3e50;
  line-height: 1.5;
  font-size: 13px;
  white-space: pre-wrap;
  word-break: break-word;
  min-height: 60px;
}

@keyframes slideDown {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.panel-content {
  padding: 16px;
}
</style>
