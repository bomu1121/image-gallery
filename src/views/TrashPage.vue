<template>
  <div class="trash-page">
    <!-- 可折叠菜单栏 -->
    <div class="collapsible-menu-bar">
      <div class="menu-header" @click="toggleMenu">
        <div class="menu-title">
          <el-icon><icon-delete /></el-icon>
          <span>回收站</span>
        </div>
        <div class="menu-toggle" :class="{ 'is-collapsed': isMenuCollapsed }">
          <el-icon><icon-arrow-down /></el-icon>
        </div>
      </div>

      <div class="menu-content" :class="{ 'is-collapsed': isMenuCollapsed }">
        <div class="menu-actions">
          <div
            class="menu-action-item"
            :class="{ active: batchRestoreMode }"
            @click="toggleBatchRestoreMode"
            title="批量恢复"
          >
            <el-icon><icon-refresh /></el-icon>
          </div>
          <div
            class="menu-action-item"
            :class="{ active: batchDeleteMode }"
            @click="toggleBatchDeleteMode"
            title="批量删除"
          >
            <el-icon><icon-delete /></el-icon>
          </div>
        </div>

        <!-- 批量操作面板 -->
        <div
          v-if="batchRestoreMode || batchDeleteMode"
          class="menu-batch-bar slide-down-panel"
        >
          <div class="batch-info">
            <span class="selected-count"
              >已选择 {{ selectedImages.size }} 张图片</span
            >
          </div>
          <div class="batch-actions">
            <el-button
              @click="selectAll"
              :disabled="selectedImages.size === displayImages.length"
              class="gray-button"
              >全选</el-button
            >
            <el-button
              @click="clearAll"
              :disabled="selectedImages.size === 0"
              class="gray-button"
              >取消选择</el-button
            >
            <template v-if="batchRestoreMode">
              <el-button
                type="primary"
                :disabled="selectedImages.size === 0"
                @click="confirmBatchRestore"
              >
                恢复选中
              </el-button>
            </template>
            <template v-else>
              <el-button
                type="danger"
                :disabled="selectedImages.size === 0"
                @click="confirmBatchDelete"
              >
                永久删除
              </el-button>
            </template>
          </div>
        </div>
      </div>
    </div>

    <div class="trash-scroll">
      <div v-if="!displayImages.length" class="empty">
        <div class="empty-content">
          <div class="empty-icon">🗑️</div>
          <div class="empty-text">回收站为空</div>
          <div class="empty-tip">删除的图片会出现在这里</div>
        </div>
      </div>

      <div class="grid" v-else>
        <div
          v-for="img in displayImages"
          :key="img.trashId"
          class="card"
          :class="{
            'is-selected': selectedImages.has(img.trashId),
          }"
        >
          <img
            :src="img.objectUrl || img.url"
            :alt="img.name"
            @click="onCardClick(img)"
            @contextmenu.prevent="onCardContextMenu($event, img)"
          />

          <!-- 组图数量徽标 -->
          <div v-if="img.groupCount > 0" class="group-count-badge">
            +{{ img.groupCount }}
          </div>

          <!-- 删除时间标签 -->
          <div class="deleted-time-badge">
            {{ formatDeletedTime(img.deletedAt) }}
          </div>

          <!-- 选中状态遮罩 -->
          <div
            v-if="selectedImages.has(img.trashId)"
            class="selection-overlay"
            @click="onCardClick(img)"
          >
            <div class="check-icon">
              <el-icon><icon-check /></el-icon>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 右键菜单 -->
    <div
      v-show="contextMenuVisible"
      class="context-menu"
      :style="{ left: contextMenuX + 'px', top: contextMenuY + 'px' }"
      @click="hideContextMenu"
    >
      <div class="context-menu-item" @click="restoreImage(contextMenuImage)">
        <el-icon><icon-refresh /></el-icon>
        <span>恢复</span>
      </div>
      <div class="context-menu-divider"></div>
      <div
        class="context-menu-item"
        @click="permanentlyDeleteImage(contextMenuImage)"
      >
        <el-icon><icon-delete /></el-icon>
        <span>永久删除</span>
      </div>
    </div>

    <!-- 预览对话框 -->
    <el-dialog
      v-model="viewerVisible"
      :title="current?.name || '预览'"
      width="70%"
    >
      <div class="viewer">
        <img
          v-if="current"
          :src="current.objectUrl || current.url"
          :alt="current.name"
        />
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from "vue";
import { useRouter } from "vue-router";
import { ElButton, ElIcon, ElDialog, ElMessageBox } from "element-plus";
import { useDrawerNotification } from "@/composables/useDrawerNotification.js";
import {
  Delete as IconDelete,
  Refresh as IconRefresh,
  Check as IconCheck,
  ArrowDown as IconArrowDown,
} from "@element-plus/icons-vue";
import {
  getTrashImages,
  restoreImageFromTrash,
  restoreImagesFromTrash,
  permanentlyDeleteFromTrash,
  permanentlyDeleteFromTrashBatch,
} from "@/utils/idb.js";

const { success, error, warning, info } = useDrawerNotification();
const router = useRouter();

const images = ref([]);
const selectedImages = ref(new Set());
const batchRestoreMode = ref(false);
const batchDeleteMode = ref(false);
const viewerVisible = ref(false);
const current = ref(null);

// 计算显示图片（只显示主图，并计算组图数量）
const displayImages = computed(() => {
  const parentImages = images.value.filter((img) => !img.parentImageId);

  return parentImages.map((parentImg) => {
    // 计算该主图有多少附图
    // 附图的条件：parentImageId 等于当前主图的 originalImageId
    const childrenCount = images.value.filter(
      (img) => img.parentImageId === parentImg.originalImageId
    ).length;

    return {
      ...parentImg,
      groupCount: childrenCount,
    };
  });
});

// 菜单栏状态
const isMenuCollapsed = ref(false);

// 右键菜单相关
const contextMenuVisible = ref(false);
const contextMenuX = ref(0);
const contextMenuY = ref(0);
const contextMenuImage = ref(null);

function revokeObjectUrls(list) {
  list?.forEach((it) => {
    if (it && it.objectUrl) {
      URL.revokeObjectURL(it.objectUrl);
    }
  });
}

async function load() {
  const prev = images.value;
  const data = await getTrashImages();
  revokeObjectUrls(prev);
  images.value = data;
}

function formatDeletedTime(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;

  const date = new Date(timestamp);
  return date.toLocaleDateString();
}

function onCardClick(img) {
  if (batchRestoreMode.value || batchDeleteMode.value) {
    // 批量模式：切换选中状态
    if (selectedImages.value.has(img.trashId)) {
      selectedImages.value.delete(img.trashId);
    } else {
      selectedImages.value.add(img.trashId);
    }
  } else {
    // 正常模式：跳转到详情页
    router.push(`/trash/${img.trashId}`);
  }
}

// 右键菜单相关函数
function showContextMenu(event, img) {
  event.preventDefault();
  contextMenuImage.value = img;

  // 先显示菜单以获取实际尺寸
  contextMenuX.value = event.clientX;
  contextMenuY.value = event.clientY;
  contextMenuVisible.value = true;

  // 使用 nextTick 确保菜单已渲染，然后调整位置
  nextTick(() => {
    adjustContextMenuPosition(event.clientX, event.clientY);
  });
}

// 调整右键菜单位置的函数
function adjustContextMenuPosition(originalX, originalY) {
  const menuElement = document.querySelector(".context-menu");
  if (!menuElement) return;

  const menuRect = menuElement.getBoundingClientRect();
  const menuWidth = menuRect.width;
  const menuHeight = menuRect.height;
  const padding = 10; // 距离屏幕边缘的最小距离

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let x = originalX;
  let y = originalY;

  // 水平方向：如果会超出右边界，则贴右边界
  if (x + menuWidth + padding > viewportWidth) {
    x = viewportWidth - menuWidth - padding;
  }

  // 垂直方向：如果会超出下边界，则贴下边界
  if (y + menuHeight + padding > viewportHeight) {
    y = viewportHeight - menuHeight - padding;
  }

  // 确保不超出左边界和上边界
  x = Math.max(padding, x);
  y = Math.max(padding, y);

  // 更新菜单位置
  contextMenuX.value = x;
  contextMenuY.value = y;
}

function onCardContextMenu(event, img) {
  showContextMenu(event, img);
}

function hideContextMenu() {
  contextMenuVisible.value = false;
  contextMenuImage.value = null;
}

// 菜单栏相关函数
function toggleMenu() {
  isMenuCollapsed.value = !isMenuCollapsed.value;
}

function toggleBatchRestoreMode() {
  if (batchRestoreMode.value) {
    batchRestoreMode.value = false;
    selectedImages.value.clear();
  } else {
    batchDeleteMode.value = false; // 互斥
    batchRestoreMode.value = true;
    selectedImages.value.clear();
  }
}

function toggleBatchDeleteMode() {
  if (batchDeleteMode.value) {
    batchDeleteMode.value = false;
    selectedImages.value.clear();
  } else {
    batchRestoreMode.value = false; // 互斥
    batchDeleteMode.value = true;
    selectedImages.value.clear();
  }
}

// 批量操作相关函数
function selectAll() {
  displayImages.value.forEach((img) => {
    if (!selectedImages.value.has(img.trashId)) {
      selectedImages.value.add(img.trashId);
    }
  });
}

function clearAll() {
  selectedImages.value.clear();
}

async function confirmBatchRestore() {
  if (selectedImages.value.size === 0) {
    warning("请先选择要恢复的图片");
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确定要恢复选中的 ${selectedImages.value.size} 张图片吗？`,
      "确认恢复",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "info",
      }
    );

    const trashIds = Array.from(selectedImages.value);
    const restoredIds = await restoreImagesFromTrash(trashIds);

    success(`成功恢复 ${restoredIds.length} 张图片`);
    selectedImages.value.clear();
    batchRestoreMode.value = false;
    await load();

    // 通知主页面刷新
    window.dispatchEvent(new CustomEvent("imageAdded"));
  } catch (err) {
    if (err !== "cancel") {
      console.error("批量恢复失败:", err);
      error("恢复失败，请重试");
    }
  }
}

async function confirmBatchDelete() {
  if (selectedImages.value.size === 0) {
    warning("请先选择要删除的图片");
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确定要永久删除选中的 ${selectedImages.value.size} 张图片吗？此操作不可撤销！`,
      "确认永久删除",
      {
        confirmButtonText: "确定删除",
        cancelButtonText: "取消",
        type: "warning",
      }
    );

    const trashIds = Array.from(selectedImages.value);
    await permanentlyDeleteFromTrashBatch(trashIds);

    success(`成功删除 ${trashIds.length} 张图片`);
    selectedImages.value.clear();
    batchDeleteMode.value = false;
    await load();
  } catch (err) {
    if (err !== "cancel") {
      console.error("批量删除失败:", err);
      error("删除失败，请重试");
    }
  }
}

// 单个图片操作
async function restoreImage(img) {
  if (!img) return;

  try {
    await restoreImageFromTrash(img.trashId);
    success("图片已恢复");
    hideContextMenu();
    await load();

    // 通知主页面刷新
    window.dispatchEvent(new CustomEvent("imageAdded"));
  } catch (error) {
    console.error("恢复图片失败:", error);
    error("恢复失败，请重试");
    hideContextMenu();
  }
}

async function permanentlyDeleteImage(img) {
  if (!img) return;

  try {
    await ElMessageBox.confirm(
      `确定要永久删除图片 "${img.name}" 吗？此操作不可撤销！`,
      "确认永久删除",
      {
        confirmButtonText: "确定删除",
        cancelButtonText: "取消",
        type: "warning",
      }
    );

    await permanentlyDeleteFromTrash(img.trashId);
    success("图片已永久删除");
    hideContextMenu();
    await load();
  } catch (err) {
    if (err !== "cancel") {
      console.error("永久删除图片失败:", err);
      error("删除失败，请重试");
    }
    hideContextMenu();
  }
}

onMounted(() => {
  load();
  // 添加全局点击事件监听，点击其他地方隐藏右键菜单
  document.addEventListener("click", hideContextMenu);
  // 添加滚动事件监听，滚动时隐藏右键菜单
  document.addEventListener("scroll", hideContextMenu, true);
});

onBeforeUnmount(() => {
  revokeObjectUrls(images.value);
  document.removeEventListener("click", hideContextMenu);
  document.removeEventListener("scroll", hideContextMenu, true);
});
</script>

<style scoped>
.trash-page {
  width: 100%;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.grid {
  column-count: 3;
  column-gap: 12px;
  padding: 16px;
}

/* 仅图片区域滚动 */
.trash-scroll {
  flex: 1;
  min-height: 0;
  /* 优先使用 overlay，如果不支持则回退到 auto */
  overflow-y: overlay;
  /* 始终为滚动条预留空间，避免宽度波动 */
  scrollbar-gutter: stable;
  /* 平滑滚动 */
  scroll-behavior: smooth;
}

/* 回退方案：对于不支持 overlay 的浏览器 */
@supports not (overflow-y: overlay) {
  .trash-scroll {
    overflow-y: auto;
  }
}

/* 自定义滚动条样式 - 透明背景，悬停显示 */
.trash-scroll::-webkit-scrollbar {
  width: 8px;
  background: transparent;
  /* 确保滚动条始终占用空间 */
  scrollbar-gutter: stable;
}

.trash-scroll::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 4px;
}

.trash-scroll::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 4px;
  transition: background-color 0.2s ease;
  /* 最小高度，确保滚动条可见性 */
  min-height: 20px;
}

/* 滚动条悬停时更明显 */
.trash-scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

/* Firefox 滚动条样式 */
.trash-scroll {
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.15) transparent;
}

/* 针对 Edge 浏览器的滚动条样式 */
.trash-scroll {
  -ms-overflow-style: -ms-autohiding-scrollbar;
}

/* 确保滚动条在触摸设备上的表现 */
@media (hover: none) {
  .trash-scroll::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
  }

  .trash-scroll {
    scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
  }
}

/* 高对比度模式支持 */
@media (prefers-contrast: high) {
  .trash-scroll::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.5);
  }

  .trash-scroll::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.7);
  }

  .trash-scroll {
    scrollbar-color: rgba(0, 0, 0, 0.5) transparent;
  }
}

.card {
  border: 1px solid #eee;
  border-radius: 6px;
  overflow: hidden;
  background: #fff;
  width: 100%;
  break-inside: avoid;
  margin-bottom: 12px;
  position: relative;
}

.card img {
  display: block;
  width: 100%;
  height: auto;
  object-fit: cover;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: #888;
}

.empty-content {
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.6;
}

.empty-text {
  font-size: 16px;
  margin-bottom: 8px;
  color: #666;
}

.empty-tip {
  font-size: 12px;
  color: #999;
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

/* 右键菜单样式 */
.context-menu {
  position: fixed;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 100px;
  padding: 2px 0;
  transition: left 0.15s ease-out, top 0.15s ease-out;
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  color: #333;
  font-size: 12px;
  line-height: 1.2;
}

.context-menu-item:hover {
  background-color: #f5f5f5;
}

.context-menu-item .el-icon {
  font-size: 12px;
  color: #666;
}

.context-menu-divider {
  height: 1px;
  background-color: #e0e0e0;
  margin: 2px 0;
}

/* 批量操作状态条样式 */
.menu-batch-bar {
  padding: 12px 16px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: rgba(245, 245, 245, 0.9);
  padding-left: 24px;
}

.batch-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.selected-count {
  font-size: 12px;
  color: #999;
  font-style: italic;
  font-weight: 400;
}

.batch-actions {
  display: flex;
  gap: 8px;
}

.batch-actions .el-button {
  font-size: 12px;
  padding: 6px 12px;
}

/* 灰色主题按钮样式 */
.gray-button {
  background: #f5f5f5 !important;
  border-color: #d9d9d9 !important;
  color: #666 !important;
}

.gray-button:hover {
  background: #e6e6e6 !important;
  border-color: #d9d9d9 !important;
  color: #333 !important;
}

.gray-button:focus {
  background: #e6e6e6 !important;
  border-color: #d9d9d9 !important;
  color: #333 !important;
}

.gray-button:active {
  background: #d9d9d9 !important;
  border-color: #d9d9d9 !important;
  color: #333 !important;
}

.gray-button.is-disabled,
.gray-button.is-disabled:hover,
.gray-button.is-disabled:focus,
.gray-button.is-disabled:active {
  background: #f5f5f5 !important;
  border-color: #e4e7ed !important;
  color: #c0c4cc !important;
}

/* 选中状态样式 */
.card.is-selected {
  border-color: #409eff;
}

.selection-overlay {
  position: absolute;
  inset: 0;
  background: rgba(64, 158, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
}

.check-icon {
  width: 32px;
  height: 32px;
  background: #409eff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

/* 删除时间标签 */
.deleted-time-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  z-index: 10;
}

/* 组图数量徽标 */
.group-count-badge {
  position: absolute;
  right: 6px;
  bottom: 6px;
  padding: 2px 6px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 12px;
  line-height: 1;
  z-index: 10;
}

/* 可折叠菜单栏样式 */
.collapsible-menu-bar {
  border-bottom: 1px solid #e0e0e0;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  background: rgba(245, 245, 245, 0.9);
  border-bottom: 1px solid #e0e0e0;
  transition: background-color 0.2s ease;
}

.menu-header:hover {
  background: #e0e0e0;
}

.menu-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.menu-title .el-icon {
  font-size: 16px;
  color: #666;
}

.menu-toggle {
  transition: transform 0.3s ease;
  color: #666;
}

.menu-toggle.is-collapsed {
  transform: rotate(-90deg);
}

.menu-content {
  max-height: none; /* 移除高度限制，让内容自然展开 */
  overflow: visible; /* 移除滚动，让内容完全可见 */
  transition: padding 0.3s ease;
  background: rgba(245, 245, 245, 0.9);
}

.menu-content.is-collapsed {
  max-height: 0;
  overflow: hidden;
}

.menu-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  padding: 16px;
}

.menu-action-item {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #666;
}

.menu-action-item:hover {
  background: #e0e0e0;
  color: #333;
}

/* 其他按钮的选中态样式 */
.menu-action-item.active {
  background: #e0e0e0;
  color: #333;
}

/* 滑动面板动画效果 */
.slide-down-panel {
  overflow: hidden;
}

.menu-batch-bar.slide-down-panel {
  animation: slideDownBatch 0.3s ease-out;
}

@keyframes slideDownBatch {
  from {
    opacity: 0;
    max-height: 0;
    padding-top: 0;
    padding-bottom: 0;
  }
  to {
    opacity: 1;
    max-height: 80px;
    padding-top: 12px;
    padding-bottom: 12px;
  }
}
</style>
