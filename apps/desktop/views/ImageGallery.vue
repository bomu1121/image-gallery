<template>
  <div class="gallery-page">
    <!-- 可折叠菜单栏 -->
    <div class="collapsible-menu-bar">
      <div class="menu-header" @click="toggleMenu">
        <div class="menu-title">
          <el-icon><icon-menu /></el-icon>
        </div>
        <div class="menu-toggle" :class="{ 'is-collapsed': isMenuCollapsed }">
          <el-icon><icon-arrow-down /></el-icon>
        </div>
      </div>

      <div class="menu-content" :class="{ 'is-collapsed': isMenuCollapsed }">
        <div class="menu-actions">
          <div
            class="menu-action-item"
            :class="{ active: uploadMode }"
            @click="toggleUploadMode"
            title="上传图片"
          >
            <el-icon><icon-plus /></el-icon>
          </div>
          <div
            class="menu-action-item"
            :class="{ active: batchDeleteMode }"
            @click="startBatchDelete"
            title="批量删除"
          >
            <el-icon><icon-delete /></el-icon>
          </div>
          <div
            class="menu-action-item"
            :class="{ active: showGroupSelector }"
            @click="onToggleGroupSelector"
            title="选择分组"
          >
            <el-icon><icon-folder /></el-icon>
          </div>
          <div
            class="menu-action-item"
            :class="{ active: showSearchArea }"
            @click="onToggleSearchArea"
            title="搜索图片"
          >
            <el-icon><icon-search /></el-icon>
          </div>
          <div
            class="menu-action-item"
            :class="{ active: albumMode }"
            @click="onStartAlbumMode"
            title="组图"
          >
            <img
              src="/src/static/images/icons/group.png"
              alt="组图"
              class="album-icon"
            />
          </div>
        </div>

        <!-- 分组选择区域 -->
        <div v-if="showGroupSelector" class="group-selector slide-down-panel">
          <div class="group-tabs">
            <!-- 新建分组按钮 -->
            <div class="group-tab create-group-tab" @click="showCreateGroup">
              <el-icon><icon-plus /></el-icon>
            </div>

            <!-- 分组设置按钮 -->
            <div
              class="group-tab settings-group-tab"
              @click="showGroupManage"
              title="分组设置"
            >
              <el-icon><icon-setting /></el-icon>
            </div>

            <!-- 分组标签 -->
            <div
              v-for="group in groups"
              :key="group.id"
              class="group-tab"
              :class="{ active: selectedGroupId === group.id }"
              @click="selectGroup(group.id)"
            >
              <span class="group-name">{{ group.name }}</span>
              <span class="group-count">({{ group.imageCount }})</span>
            </div>
          </div>
        </div>

        <!-- 上传区域 -->
        <div v-if="uploadMode" class="upload-area slide-down-panel" 
    @dragover.prevent="console.log('[drag:raw] dragover on upload-area')"
    @dragenter="console.log('[drag:raw] dragenter on upload-area')"  
    @drop.prevent="console.log('[drag:raw] drop on upload-area', $event.dataTransfer?.files)"
  >
          <el-upload
            class="uploader"
            drag
            :auto-upload="false"
            :show-file-list="false"
            accept="image/*"
            :on-change="onFileChange"
          >
            <el-icon class="el-icon--upload"><icon-plus /></el-icon>
            <div class="el-upload__text">拖拽图片到此处，或点击选择</div>
            <!-- <div class="el-upload__tip">支持 Ctrl+V 粘贴图片</div> -->
          </el-upload>
        </div>

        <!-- 批量删除/组图模式操作（共用面板，互斥显示） -->
        <div
          v-if="batchDeleteMode || albumMode"
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
              :disabled="selectedImages.size === images.length"
              class="gray-button"
              >全选</el-button
            >
            <el-button
              @click="clearAll"
              :disabled="selectedImages.size === 0"
              class="gray-button"
              >取消选择</el-button
            >
            <template v-if="batchDeleteMode">
              <el-button
                @click="confirmBatchDelete"
                :disabled="selectedImages.size === 0"
                class="batch-delete-icon-button"
                circle
              >
                <el-icon><icon-delete /></el-icon>
              </el-button>
            </template>
            <template v-else>
              <el-button
                type="primary"
                :disabled="selectedImages.size === 0"
                @click="emit('createAlbumFromSelection')"
              >
                添加到组图
              </el-button>
            </template>
          </div>
        </div>

        <!-- 搜索区域 -->
        <div v-if="showSearchArea" class="search-area slide-down-panel">
          <div class="search-form">
            <div class="search-field">
              <el-input
                v-model="searchName"
                placeholder="输入图片名称"
                clearable
                @input="onSearchChange"
                @clear="onSearchChange"
              />
            </div>
            <div class="search-field">
              <div class="tags-container">
                <div class="tags-display">
                  <!-- 现有搜索标签 -->
                  <div
                    v-for="tag in searchTags"
                    :key="tag"
                    class="tag-item"
                    @click="removeTag(tag)"
                  >
                    {{ tag }}
                    <el-icon class="tag-remove"><icon-delete /></el-icon>
                  </div>

                  <!-- 添加标签按钮 -->
                  <div
                    v-if="!isAddingSearchTag"
                    class="add-tag-button"
                    @click="startAddingSearchTag"
                  >
                    <el-icon><icon-plus /></el-icon>
                  </div>

                  <!-- 提示文字（当没有标签时显示） -->
                  <div
                    v-if="searchTags.length === 0 && !isAddingSearchTag"
                    class="tag-hint-text"
                  >
                    按标签搜索
                  </div>

                  <!-- 正在添加的标签输入框 -->
                  <div
                    v-if="isAddingSearchTag"
                    class="tag-item adding-tag"
                    :style="{ width: searchTagInputWidth + 'px' }"
                  >
                    <input
                      v-model="newSearchTagInput"
                      ref="searchTagInput"
                      class="tag-input-field"
                      placeholder="输入标签"
                      @keyup.enter="confirmAddSearchTag"
                      @keyup.escape="cancelAddSearchTag"
                      @blur="confirmAddSearchTag"
                      @input="adjustSearchTagInputWidth"
                    />
                  </div>
                </div>
              </div>
            </div>
            <!-- 暂时隐藏清空搜索按钮区域 -->
            <!-- <div class="search-actions">
              <el-button @click="clearSearch" size="small">清空搜索</el-button>
            </div> -->
          </div>
        </div>
      </div>
    </div>

    <div class="gallery-scroll">
      <div v-if="!images.length" class="empty">
        <!-- <div class="empty-content">
          <div class="empty-icon">📷</div>
          <div class="empty-text">暂无图片，请先上传</div>
          <div class="empty-tip">支持拖拽上传、点击上传或 Ctrl+V 粘贴图片</div>
        </div> -->
      </div>

      <div class="grid" :style="gridStyle" v-else>
        <div
          v-for="img in images"
          :key="img.id"
          class="card"
          :class="{
            'is-deleting': isDeleting(img.id),
            'is-selected':
              (batchDeleteMode || albumMode) && selectedImages.has(img.id),
            'is-main-image': albumMode && isMainImage(img.id),
          }"
        >
          <img
            :src="img.objectUrl || img.url"
            :alt="img.name"
            @click="onCardClick(img)"
            @contextmenu.prevent="
              !batchDeleteMode && onCardContextMenu($event, img)
            "
          />
          <div v-if="coverCounts[img.id] > 0" class="album-count-badge">
            +{{ coverCounts[img.id] }}
          </div>

          <div v-if="isDeleting(img.id)" class="deleting-overlay">
            <div class="spinner" />
          </div>
          <!-- 选中状态遮罩 -->
          <div
            v-if="(batchDeleteMode || albumMode) && selectedImages.has(img.id)"
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
      <div
        class="context-menu-item"
        @click="copyImageToClipboard(contextMenuImage)"
      >
        <el-icon><icon-copy /></el-icon>
        <span>复制</span>
      </div>
      <div class="context-menu-item" @click="downloadImage(contextMenuImage)">
        <el-icon><icon-download /></el-icon>
        <span>下载</span>
      </div>
      <div class="context-menu-item" @click="showGroupMenu(contextMenuImage)">
        <el-icon><icon-folder /></el-icon>
        <span>分组</span>
      </div>
      <div
        class="context-menu-item"
        @click="addToAlbumFromContext(contextMenuImage)"
      >
        <el-icon><icon-plus /></el-icon>
        <span>新增组图</span>
      </div>
      <div
        v-if="isContextMenuImageGroup"
        class="context-menu-item"
        @click="restoreGroupFromContext(contextMenuImage)"
      >
        <el-icon><icon-setting /></el-icon>
        <span>组图还原</span>
      </div>
      <div class="context-menu-divider"></div>
      <div
        class="context-menu-item"
        @click="deleteImageFromContext(contextMenuImage)"
      >
        <el-icon><icon-delete /></el-icon>
        <span>删除</span>
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

    <!-- 自定义确认删除对话框 -->
    <CustomDialog
      :visible="dialogVisible"
      :title="dialogConfig.title"
      :message="dialogConfig.message"
      :type="dialogConfig.type"
      :show-cancel-button="dialogConfig.showCancelButton"
      :confirm-button-text="dialogConfig.confirmButtonText"
      :cancel-button-text="dialogConfig.cancelButtonText"
      @confirm="handleConfirm"
      @cancel="handleCancel"
    />
  </div>
</template>

<script setup>
import {
  ref,
  onMounted,
  onBeforeUnmount,
  computed,
  watch,
  nextTick,
} from "vue";
import { useRouter } from "vue-router";
import {
  ElButton,
  ElIcon,
  ElEmpty,
  ElDialog,
  ElUpload,
  // ElMessageBox,
} from "element-plus";
import { useDrawerNotification } from "@/composables/useDrawerNotification.js";
import { useConfirmDelete } from "@/composables/useConfirmDelete.js";
import CustomDialog from "@/components/CustomDialog.vue";
import {
  Delete as IconDelete,
  CopyDocument as IconCopy,
  Download as IconDownload,
  Folder as IconFolder,
  Check as IconCheck,
  Menu as IconMenu,
  ArrowDown as IconArrowDown,
  Upload as IconUpload,
  Plus as IconPlus,
  Setting as IconSetting,
  Search as IconSearch,
} from "@element-plus/icons-vue";
import {
  getAllImages,
  deleteImageToTrash,
  getChildrenImages,
  restoreGroupToIndividualImages,
} from "@/utils/idb.js";

// Props
const props = defineProps({
  batchDeleteMode: {
    type: Boolean,
    default: false,
  },
  selectedImages: {
    type: Set,
    default: () => new Set(),
  },
  albumMode: {
    type: Boolean,
    default: false,
  },
  groups: {
    type: Array,
    default: () => [],
  },
  selectedGroupId: {
    type: Number,
    default: 0,
  },
  showGroupSelector: {
    type: Boolean,
    default: false,
  },
  uploadMode: {
    type: Boolean,
    default: false,
  },
});

// Emits
const emit = defineEmits([
  "toggleImageSelection",
  "clearSelection",
  "batchDelete",
  "startBatchDelete",
  "showGroupSelector",
  "selectGroup",
  "showCreateGroup",
  "showGroupManage",
  "toggleUploadMode",
  "fileChange",
  "startAlbumMode",
  "createAlbumFromSelection",
]);

const router = useRouter();
const { success, error, warning, info } = useDrawerNotification();
const { dialogVisible, dialogConfig, deleteConfirm } = useConfirmDelete();

const images = ref([]);
const coverCounts = ref({}); // { [imageId]: number }
const hiddenImageIds = ref(new Set()); // 需要在主列表隐藏的图片（相册内非封面）
// 移除小卡展开所需的本地状态
const viewerVisible = ref(false);
const current = ref(null);
const deletingIds = ref([]);
const MIN_DELETE_MS = 800; // 调试用最小展示时长

// 列数设置
const columnCount = ref(3); // 默认三列

// 取消可见数量限制，改为完整展示（结合样式做换行/布局）

// 菜单栏状态
const isMenuCollapsed = ref(false);

// 搜索相关状态
const showSearchArea = ref(false);
const searchName = ref("");
const searchTagsInput = ref("");
const searchTags = ref([]);
const isSearchActive = ref(false);
const originalImages = ref([]); // 保存原始图片列表，用于搜索后恢复

// 搜索标签添加相关状态
const isAddingSearchTag = ref(false);
const newSearchTagInput = ref("");
const searchTagInput = ref(null);
const searchTagInputWidth = ref(80); // 默认最小宽度

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withMinDuration(taskPromise, minMs) {
  const startedAt = Date.now();
  const result = await taskPromise;
  const elapsed = Date.now() - startedAt;
  if (elapsed < minMs) await sleep(minMs - elapsed);
  return result;
}

function isDeleting(id) {
  return deletingIds.value.includes(id);
}

// 判断是否为组图模式下的主图（第一个选中的图片）
function isMainImage(id) {
  if (!props.albumMode || props.selectedImages.size === 0) return false;
  const selectedArray = Array.from(props.selectedImages);
  return selectedArray.length > 0 && selectedArray[0] === id;
}

// 判断图片是否可以被选择（组图模式下的选择限制）
function canSelectImage(id) {
  if (!props.albumMode) return true;

  const selectedArray = Array.from(props.selectedImages);

  // 如果还没有选择任何图片，可以选择任何图片（包括组图）
  if (selectedArray.length === 0) {
    return true;
  }

  // 如果已经选择了图片，后续只能选择独立图片（非组图）
  const img = images.value.find((img) => img.id === id);
  if (!img) return false;

  // 检查是否为独立图片（没有附图的主图）
  return coverCounts.value[id] === undefined || coverCounts.value[id] === 0;
}

function startDeleting(id) {
  if (!isDeleting(id)) deletingIds.value.push(id);
}

function stopDeleting(id) {
  deletingIds.value = deletingIds.value.filter((x) => x !== id);
}

// 右键菜单相关
const contextMenuVisible = ref(false);
const contextMenuX = ref(0);
const contextMenuY = ref(0);
const contextMenuImage = ref(null);
const isContextMenuImageGroup = ref(false);

function revokeObjectUrls(list) {
  list?.forEach((it) => {
    if (it && it.objectUrl) {
      URL.revokeObjectURL(it.objectUrl);
    }
  });
}

async function load() {
  const prev = images.value;
  const data = await getAllImages();
  revokeObjectUrls(prev);

  // 根据选中的分组筛选图片
  let filteredData = data;
  if (props.selectedGroupId !== null && props.selectedGroupId !== undefined) {
    if (props.selectedGroupId === -1) {
      // "全部"分组：显示所有图片
      filteredData = data;
    } else {
      // 其他分组：过滤出指定分组的图片
      filteredData = data.filter(
        (img) => (img.groupId || 0) === props.selectedGroupId
      );
    }
  }

  // 基于 parentImageId 统计：附图隐藏，主图显示 +N
  const newCoverCounts = {};
  const newHidden = new Set();
  for (const img of filteredData) {
    if (img.parentImageId !== null && img.parentImageId !== undefined) {
      newHidden.add(img.id);
      const pid = img.parentImageId;
      newCoverCounts[pid] = (newCoverCounts[pid] || 0) + 1;
    }
  }
  coverCounts.value = newCoverCounts;
  hiddenImageIds.value = newHidden;

  // 仅显示主图
  const visibleData = filteredData.filter(
    (r) => r.parentImageId === null || r.parentImageId === undefined
  );

  images.value = visibleData.map((r) => ({
    ...r,
    objectUrl:
      r.blob && r.blob instanceof Blob ? URL.createObjectURL(r.blob) : r.url,
  }));

  // 如果当前处于搜索状态，则基于新的分组数据重新应用搜索条件
  if (isSearchActive.value) {
    originalImages.value = [...images.value];
    performRealtimeSearch();
  }
}

onMounted(() => {
  // 让出一次渲染时机，优先绘制侧边栏选中态，再开始加载
  setTimeout(() => {
    load();
  }, 0);
  // 添加全局点击事件监听，点击其他地方隐藏右键菜单
  document.addEventListener("click", hideContextMenu);
  // 添加滚动事件监听，滚动时隐藏右键菜单
  document.addEventListener("scroll", hideContextMenu, true);
  // 监听上传完成事件，刷新列表
  window.addEventListener("imageAdded", load);

  // 监听列数变化事件
  window.addEventListener("columnCountChanged", handleColumnCountChanged);

  // 初始化列数设置
  initializeColumnCount();
});

// 监听分组变化，重新加载图片
watch(
  () => props.selectedGroupId,
  () => {
    load();
  }
);

onBeforeUnmount(() => {
  revokeObjectUrls(images.value);
  document.removeEventListener("click", hideContextMenu);
  document.removeEventListener("scroll", hideContextMenu, true);
  window.removeEventListener("imageAdded", load);
  window.removeEventListener("columnCountChanged", handleColumnCountChanged);
});

async function remove(id) {
  if (isDeleting(id)) return;
  startDeleting(id);
  try {
    console.time(`delete-image-${id}`);
    await withMinDuration(deleteImageToTrash(id), MIN_DELETE_MS);
    console.timeEnd(`delete-image-${id}`);
    await load();
    // 通知上层同步分组计数等派生数据
    window.dispatchEvent(new CustomEvent("imageAdded"));
  } finally {
    stopDeleting(id);
  }
}

function openViewer(img) {
  current.value = img;
  viewerVisible.value = true;
}

function goToDetail(img) {
  router.push(`/image/${img.id}`);
}

function onCardClick(img) {
  if (isDeleting(img.id)) return;

  if (props.batchDeleteMode || props.albumMode) {
    // 批量删除 / 组图模式 下，切换选中状态
    // 在组图模式下，需要检查选择限制
    if (props.albumMode && !canSelectImage(img.id)) {
      return;
    }
    emit("toggleImageSelection", img.id);
  } else {
    // 正常模式下，跳转到详情页
    goToDetail(img);
  }
}

// 右键菜单相关函数
async function showContextMenu(event, img) {
  event.preventDefault();
  contextMenuImage.value = img;

  // 检查是否为组图
  try {
    const children = await getChildrenImages(img.id);
    isContextMenuImageGroup.value = children.length > 0;
  } catch (err) {
    console.error("检查组图状态失败:", err);
    isContextMenuImageGroup.value = false;
  }

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
  if (isDeleting(img.id)) return;
  showContextMenu(event, img);
}

function hideContextMenu() {
  contextMenuVisible.value = false;
  contextMenuImage.value = null;
  isContextMenuImageGroup.value = false;
}

async function copyImageToClipboard(img) {
  if (!img) return;

  try {
    console.log("开始复制图片:", img.name);

    // 获取图片的blob数据
    let imageBlob;
    if (img.blob) {
      imageBlob = img.blob;
      console.log(
        "使用原始blob数据，大小:",
        imageBlob.size,
        "类型:",
        imageBlob.type
      );
    } else if (img.objectUrl) {
      // 如果只有objectUrl，需要先获取blob
      console.log("从objectUrl获取blob数据");
      const response = await fetch(img.objectUrl);
      imageBlob = await response.blob();
      console.log(
        "获取到blob数据，大小:",
        imageBlob.size,
        "类型:",
        imageBlob.type
      );
    } else {
      error("无法获取图片数据");
      return;
    }

    // 确保blob有正确的MIME类型
    if (!imageBlob.type || imageBlob.type === "application/octet-stream") {
      console.log("修正MIME类型");
      // 根据文件扩展名推断MIME类型
      const fileName = img.name || "image";
      if (fileName.toLowerCase().includes(".png")) {
        imageBlob = new Blob([imageBlob], { type: "image/png" });
      } else if (
        fileName.toLowerCase().includes(".jpg") ||
        fileName.toLowerCase().includes(".jpeg")
      ) {
        imageBlob = new Blob([imageBlob], { type: "image/jpeg" });
      } else if (fileName.toLowerCase().includes(".gif")) {
        imageBlob = new Blob([imageBlob], { type: "image/gif" });
      } else if (fileName.toLowerCase().includes(".webp")) {
        imageBlob = new Blob([imageBlob], { type: "image/webp" });
      } else {
        // 默认为PNG
        imageBlob = new Blob([imageBlob], { type: "image/png" });
      }
      console.log("修正后的MIME类型:", imageBlob.type);
    }

    // 先尝试清空剪贴板
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText("");
        console.log("剪贴板已清空");
        // 等待一小段时间确保清空操作完成
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    } catch (clearError) {
      console.warn("清空剪贴板失败:", clearError);
    }

    // 方法1：优先使用现代剪贴板API（需要转换为PNG）
    if (navigator.clipboard && window.ClipboardItem) {
      try {
        console.log("尝试使用现代剪贴板API");

        // 现代剪贴板API主要支持PNG格式，需要转换
        let clipboardBlob = imageBlob;
        if (imageBlob.type === "image/jpeg" || imageBlob.type === "image/jpg") {
          console.log("JPEG格式需要转换为PNG");
          // 创建canvas来转换JPEG为PNG
          const tempCanvas = document.createElement("canvas");
          const tempCtx = tempCanvas.getContext("2d");
          const tempImg = document.createElement("img");

          tempImg.src =
            imageBlob instanceof Blob
              ? URL.createObjectURL(imageBlob)
              : imageBlob;
          await new Promise((resolve, reject) => {
            tempImg.onload = resolve;
            tempImg.onerror = reject;
            setTimeout(() => reject(new Error("图片加载超时")), 5000);
          });

          tempCanvas.width = tempImg.naturalWidth;
          tempCanvas.height = tempImg.naturalHeight;
          tempCtx.drawImage(tempImg, 0, 0);

          clipboardBlob = await new Promise((resolve, reject) => {
            tempCanvas.toBlob((blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error("Canvas转换失败"));
              }
            }, "image/png");
          });

          URL.revokeObjectURL(tempImg.src);
          console.log("JPEG转换为PNG成功，大小:", clipboardBlob.size);
        }

        const clipboardItem = new ClipboardItem({
          [clipboardBlob.type]: clipboardBlob,
        });
        await navigator.clipboard.write([clipboardItem]);

        // 验证复制是否成功
        try {
          const clipboardItems = await navigator.clipboard.read();
          console.log("剪贴板验证成功，项目数量:", clipboardItems.length);
          if (clipboardItems.length > 0) {
            const item = clipboardItems[0];
            const types = item.types;
            console.log("剪贴板中的类型:", types);
            success("图片已复制到剪贴板");
            hideContextMenu();
            return;
          }
        } catch (verifyError) {
          console.warn("剪贴板验证失败:", verifyError);
          // 即使验证失败，也可能复制成功了
          success("图片已复制到剪贴板");
          hideContextMenu();
          return;
        }
      } catch (clipboardError) {
        console.warn("现代剪贴板API失败:", clipboardError);
        // 继续尝试其他方法
      }
    }

    // 方法2：使用Canvas + 现代剪贴板API
    console.log("尝试使用Canvas方法");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // 创建一个临时的隐藏图片元素用于绘制到canvas
    const tempImg = document.createElement("img");
    tempImg.style.position = "absolute";
    tempImg.style.left = "-9999px";
    tempImg.style.top = "-9999px";
    tempImg.style.width = "1px";
    tempImg.style.height = "1px";
    tempImg.src =
      imageBlob instanceof Blob ? URL.createObjectURL(imageBlob) : imageBlob;
    document.body.appendChild(tempImg);

    // 等待图片加载完成
    await new Promise((resolve, reject) => {
      tempImg.onload = resolve;
      tempImg.onerror = reject;
      setTimeout(() => reject(new Error("图片加载超时")), 5000);
    });

    canvas.width = tempImg.naturalWidth;
    canvas.height = tempImg.naturalHeight;
    ctx.drawImage(tempImg, 0, 0);
    console.log("Canvas绘制完成，尺寸:", canvas.width, "x", canvas.height);

    try {
      // 将canvas转换为blob（强制使用PNG格式）
      const canvasBlob = await new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Canvas转换失败"));
          }
        }, "image/png"); // 强制使用PNG格式
      });
      console.log(
        "Canvas转换为blob成功，大小:",
        canvasBlob.size,
        "类型:",
        canvasBlob.type
      );

      // 尝试使用现代剪贴板API
      if (navigator.clipboard && navigator.clipboard.write) {
        try {
          console.log("尝试使用Canvas + 剪贴板API");
          await navigator.clipboard.write([
            new ClipboardItem({ [canvasBlob.type]: canvasBlob }),
          ]);

          success("图片已复制到剪贴板");
          hideContextMenu();
          return;
        } catch (error) {
          console.warn("Canvas剪贴板API失败:", error);
          // 继续尝试其他方法
        }
      }

      // 方法3：使用execCommand（兼容性方法）
      try {
        console.log("尝试使用execCommand方法");

        // 创建一个可选择的元素
        const selectableDiv = document.createElement("div");
        selectableDiv.style.position = "absolute";
        selectableDiv.style.left = "-9999px";
        selectableDiv.style.top = "-9999px";
        selectableDiv.style.width = "1px";
        selectableDiv.style.height = "1px";
        selectableDiv.style.overflow = "hidden";

        // 将canvas添加到可选择的div中
        selectableDiv.appendChild(canvas);
        document.body.appendChild(selectableDiv);

        // 选择canvas并复制
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(canvas);
        selection.removeAllRanges();
        selection.addRange(range);

        const execSuccess = document.execCommand("copy");
        console.log("execCommand复制结果:", execSuccess);

        // 清理
        document.body.removeChild(selectableDiv);
        selection.removeAllRanges();

        if (execSuccess) {
          success("图片已复制到剪贴板");
          hideContextMenu();
          return;
        }
      } catch (execError) {
        console.warn("execCommand失败:", execError);
      }

      // 方法4：最后的备选方案 - 提示用户下载
      warning("复制失败，是否要下载图片？");
      hideContextMenu();
    } catch (canvasError) {
      console.warn("Canvas处理失败:", canvasError);
      info("复制失败，请使用下载功能");
      hideContextMenu();
    } finally {
      // 清理临时元素
      document.body.removeChild(tempImg);
      URL.revokeObjectURL(tempImg.src);
    }
  } catch (error) {
    console.error("复制失败:", error);
    info("复制失败，请使用下载功能");
    hideContextMenu();
  }
}

async function downloadImage(img) {
  if (!img) return;

  try {
    // 获取图片的blob数据
    let imageBlob;
    if (img.blob) {
      imageBlob = img.blob;
    } else if (img.objectUrl) {
      // 如果只有objectUrl，需要先获取blob
      const response = await fetch(img.objectUrl);
      imageBlob = await response.blob();
    } else {
      error("无法获取图片数据");
      return;
    }

    // 创建下载链接
    const url =
      imageBlob instanceof Blob ? URL.createObjectURL(imageBlob) : imageBlob;
    const link = document.createElement("a");
    link.href = url;
    link.download = img.name || "image";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    success("图片已下载到本地");
    hideContextMenu();
  } catch (error) {
    console.error("下载失败:", error);
    error("下载失败，请重试");
    hideContextMenu();
  }
}

async function deleteImageFromContext(img) {
  if (!img) return;

  try {
    if (isDeleting(img.id)) return;
    // 关闭菜单后展示删除中的遮罩
    hideContextMenu();
    startDeleting(img.id);
    console.time(`delete-image-${img.id}`);
    await withMinDuration(deleteImageToTrash(img.id), MIN_DELETE_MS);
    console.timeEnd(`delete-image-${img.id}`);
    success("图片已移动到回收站");
    await load();

    // 触发分组数量更新事件
    window.dispatchEvent(new CustomEvent("imageAdded"));
  } catch (error) {
    error("删除失败");
  } finally {
    stopDeleting(img.id);
  }
}

function showGroupMenu(img) {
  // 触发全局事件，显示分组选择对话框
  window.dispatchEvent(
    new CustomEvent("showImageGroupDialog", {
      detail: { image: img },
    })
  );
  hideContextMenu();
}

// 从右键菜单新增组图
function addToAlbumFromContext(img) {
  if (!img) return;

  // 触发组图模式并选中该图片
  emit("startAlbumMode");
  emit("toggleImageSelection", img.id);

  hideContextMenu();
}

// 处理确认删除对话框
function handleConfirm() {
  if (dialogConfig.value._onConfirm) {
    dialogConfig.value._onConfirm();
  }
}

function handleCancel() {
  if (dialogConfig.value._onCancel) {
    dialogConfig.value._onCancel();
  }
}

// 从右键菜单还原组图
async function restoreGroupFromContext(img) {
  if (!img) return;

  try {
    // 获取附图数量
    const children = await getChildrenImages(img.id);
    const childrenCount = children.length;

    if (childrenCount === 0) {
      error("该图片没有附图，无法还原组图");
      return;
    }

    // 显示确认对话框
    await deleteConfirm(
      `确定要将组图 "${img.name}" 还原为 ${
        childrenCount + 1
      } 张独立图片吗？\n还原后，所有图片将变为独立图片，组图关系将被解除。`,
      "组图还原确认",
      {
        confirmButtonText: "确定还原",
        cancelButtonText: "取消",
      }
    );

    // 执行还原操作
    const restoredCount = await restoreGroupToIndividualImages(img.id);

    success(`组图已还原，${restoredCount + 1} 张图片已变为独立图片`);

    // 重新加载图片列表
    await load();

    // 触发分组数量更新事件
    window.dispatchEvent(new CustomEvent("imageAdded"));
  } catch (err) {
    if (err.message === "用户取消") {
      // 用户取消还原，不显示错误信息
      return;
    }
    console.error("还原组图失败:", err);
    error("还原组图失败，请重试");
  } finally {
    hideContextMenu();
  }
}

// 批量删除相关函数
function selectAll() {
  images.value.forEach((img) => {
    if (!props.selectedImages.has(img.id)) {
      emit("toggleImageSelection", img.id);
    }
  });
}

function clearAll() {
  emit("clearSelection");
}

function exitBatchMode() {
  emit("clearSelection");
}

function confirmBatchDelete() {
  if (props.selectedImages.size === 0) {
    warning("请先选择要删除的图片");
    return;
  }

  // 直接触发批量删除事件，让父组件处理确认逻辑
  emit("batchDelete");
}

// 菜单栏相关函数
function toggleMenu() {
  isMenuCollapsed.value = !isMenuCollapsed.value;
}

// 顶部刷新按钮已移除

function toggleUploadMode() {
  emit("toggleUploadMode");
}

function onFileChange(file) {
  console.log("[drag:1] ImageGallery emit fileChange", file?.name);
  emit("fileChange", file);
}

function startBatchDelete() {
  emit("startBatchDelete");
}

function onToggleGroupSelector() {
  emit("showGroupSelector");
}

function selectGroup(groupId) {
  emit("selectGroup", groupId);
}

function showCreateGroup() {
  emit("showCreateGroup");
}

function showGroupManage() {
  emit("showGroupManage");
}

function onStartAlbumMode() {
  emit("startAlbumMode");
}

// 搜索相关函数
function onToggleSearchArea() {
  showSearchArea.value = !showSearchArea.value;
  if (!showSearchArea.value) {
    // 关闭搜索区域时，清除搜索状态
    clearSearch();
  }
}

function onSearchChange() {
  // 实时搜索
  performRealtimeSearch();
}

function addTagFromInput() {
  // 处理标签输入，添加当前输入框的内容作为标签
  if (searchTagsInput.value) {
    const tag = searchTagsInput.value.trim();
    if (tag && !searchTags.value.includes(tag)) {
      searchTags.value.push(tag);
      searchTagsInput.value = "";
      // 添加标签后触发搜索
      performRealtimeSearch();
    }
  }
}

// 搜索标签管理函数
function startAddingSearchTag() {
  isAddingSearchTag.value = true;
  newSearchTagInput.value = "";
  searchTagInputWidth.value = 80; // 重置为默认宽度

  // 等待DOM更新后聚焦输入框
  setTimeout(() => {
    if (searchTagInput.value) {
      searchTagInput.value.focus();
    }
  }, 100);
}

function cancelAddSearchTag() {
  isAddingSearchTag.value = false;
  newSearchTagInput.value = "";
}

function confirmAddSearchTag() {
  if (!newSearchTagInput.value.trim()) {
    cancelAddSearchTag();
    return;
  }

  const tag = newSearchTagInput.value.trim();

  // 检查标签是否已存在
  if (searchTags.value.includes(tag)) {
    error("标签已存在");
    cancelAddSearchTag();
    return;
  }

  // 添加标签到搜索列表
  searchTags.value.push(tag);

  // 清空输入框并退出添加模式
  newSearchTagInput.value = "";
  isAddingSearchTag.value = false;

  // 触发搜索
  performRealtimeSearch();
}

// 动态调整搜索标签输入框宽度
function adjustSearchTagInputWidth() {
  if (!searchTagInput.value) return;

  // 使用Canvas API来精确测量文本宽度
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  // 设置字体样式，与CSS中的样式保持一致
  context.font =
    '500 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

  const text = newSearchTagInput.value || "输入标签";
  const textWidth = context.measureText(text).width;

  // 设置最小宽度80px，最大宽度200px，并加上一些padding
  searchTagInputWidth.value = Math.min(Math.max(textWidth + 24, 80), 200);
}

function removeTag(tag) {
  const index = searchTags.value.indexOf(tag);
  if (index > -1) {
    searchTags.value.splice(index, 1);
    // 删除标签后触发实时搜索
    performRealtimeSearch();
  }
}

function performRealtimeSearch() {
  // 如果没有搜索条件，恢复原始状态
  if (!searchName.value && searchTags.value.length === 0) {
    if (isSearchActive.value) {
      clearSearch();
    }
    return;
  }

  // 保存原始图片列表（如果还没有保存）
  if (!isSearchActive.value) {
    originalImages.value = [...images.value];
  }

  // 执行搜索
  let filteredImages = [...originalImages.value];

  // 按名称搜索（前缀匹配）
  if (searchName.value) {
    const nameKeyword = searchName.value.toLowerCase();
    filteredImages = filteredImages.filter(
      (img) => img.name && img.name.toLowerCase().startsWith(nameKeyword)
    );
  }

  // 按标签搜索（前缀匹配）
  if (searchTags.value.length > 0) {
    filteredImages = filteredImages.filter((img) => {
      return searchTags.value.some((searchTag) => {
        const searchTagLower = searchTag.toLowerCase();
        // 检查图片是否有标签，并且标签中包含搜索关键词
        if (img.tags && Array.isArray(img.tags)) {
          return img.tags.some((imgTag) =>
            imgTag.toLowerCase().includes(searchTagLower)
          );
        }
        return false;
      });
    });
  }

  images.value = filteredImages;
  isSearchActive.value = true;
}

function clearSearch() {
  searchName.value = "";
  searchTagsInput.value = "";
  searchTags.value = [];
  isSearchActive.value = false;

  // 清理搜索标签添加状态
  isAddingSearchTag.value = false;
  newSearchTagInput.value = "";

  // 恢复原始图片列表
  if (originalImages.value.length > 0) {
    images.value = [...originalImages.value];
    originalImages.value = [];
  }
}

// 初始化列数设置
function initializeColumnCount() {
  const savedColumnCount = localStorage.getItem("imageGalleryColumnCount");
  if (savedColumnCount) {
    try {
      const parsed = JSON.parse(savedColumnCount);
      columnCount.value = parsed;
    } catch (e) {
      console.warn("Failed to parse saved column count:", e);
    }
  }
}

// 处理列数变化
function handleColumnCountChanged(event) {
  columnCount.value = event.detail.columnCount;
}

// 计算网格样式
const gridStyle = computed(() => {
  if (columnCount.value === "auto") {
    return {
      columnCount: "auto",
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
      gap: "12px",
    };
  } else {
    return {
      columnCount: columnCount.value.toString(),
      display: "block",
    };
  }
});
</script>

<style scoped>
.gallery-page {
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
.gallery-scroll {
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
  .gallery-scroll {
    overflow-y: auto;
  }
}

/* 自定义滚动条样式 - 透明背景，悬停显示 */
.gallery-scroll::-webkit-scrollbar {
  width: 8px;
  background: transparent;
  /* 确保滚动条始终占用空间 */
  scrollbar-gutter: stable;
}

.gallery-scroll::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 4px;
}

.gallery-scroll::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 4px;
  transition: background-color 0.2s ease;
  /* 最小高度，确保滚动条可见性 */
  min-height: 20px;
}

/* 滚动条悬停时更明显 */
.gallery-scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

/* Firefox 滚动条样式 */
.gallery-scroll {
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.15) transparent;
}

/* 针对 Edge 浏览器的滚动条样式 */
.gallery-scroll {
  -ms-overflow-style: -ms-autohiding-scrollbar;
}

/* 确保滚动条在触摸设备上的表现 */
@media (hover: none) {
  .gallery-scroll::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
  }

  .gallery-scroll {
    scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
  }
}

/* 高对比度模式支持 */
@media (prefers-contrast: high) {
  .gallery-scroll::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.5);
  }

  .gallery-scroll::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.7);
  }

  .gallery-scroll {
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

/* 主图特殊样式 */
.card.is-main-image {
  /* 主图样式可以在这里添加 */
  position: relative;
}

.card.is-main-image::before {
  content: "主图";
  position: absolute;
  top: 8px;
  left: 8px;
  background: #409eff;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  z-index: 10;
  box-shadow: 0 2px 4px rgba(64, 158, 255, 0.3);
}
.card img {
  display: block;
  width: 100%;
  height: auto;
  object-fit: cover;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.card.is-deleting img {
  filter: blur(4px);
  pointer-events: none;
}
.deleting-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.4);
}
.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(0, 0, 0, 0.15);
  border-top-color: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
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

/* 批量删除状态条样式 */
.batch-delete-bar {
  position: sticky;
  top: 0;
  background: #fff;
  border-bottom: 1px solid #e0e0e0;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 100;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 折叠区域内的批量操作条复用样式 */
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

.batch-delete-icon-button {
  background: transparent !important;
  border: none !important;
  color: #ff6b6b !important;
  transition: all 0.3s ease !important;
  width: 32px !important;
  height: 32px !important;
  padding: 0 !important;
  box-shadow: none !important;
}

.batch-delete-icon-button:hover {
  color: #ff5252 !important;
}

.batch-delete-icon-button:disabled {
  background: transparent !important;
  color: #c0c4cc !important;
  transform: none !important;
}

.batch-delete-icon-button .el-icon {
  font-size: 18px !important;
}

/* 选中状态样式 */
.card.is-selected {
  border-color: #409eff;
  /* box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2); */
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

/* 组图数量徽标 */
.album-count-badge {
  position: absolute;
  right: 6px;
  bottom: 6px;
  padding: 2px 6px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 12px;
  line-height: 1;
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
  height: 30px;
  width: 30px;
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
  padding: 8px;
}

.menu-action-item {
  width: 30px;
  height: 30px;
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

/* 区分上传按钮的样式（始终突出） */
.menu-action-item.upload {
  background: #f0f0f0;
  color: #666;
}
.menu-action-item.upload:hover {
  background: #e0e0e0;
  color: #333;
}

/* 其他按钮的选中态样式 */
.menu-action-item.active {
  background: #e0e0e0;
  color: #333;
}

/* 组图图标样式 */
.menu-action-item .album-icon {
  width: 22px;
  height: auto;
  object-fit: contain;
}

/* 上传区域样式 */
.upload-area {
  border-top: 1px solid #e0e0e0;
  background-color: rgba(245, 245, 245, 0.9);
  padding: 16px;
  height: 120px; /* 固定高度 */
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-area .uploader {
  border: 2px dashed #d9d9d9;
}

.upload-area .uploader:hover {
  border-color: rgba(0, 0, 0, 0.3);
  background: rgba(0, 0, 0, 0.05);
}

.uploader {
  border: none; /* 移除默认边框，避免双层虚线 */
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #fafafa;
}

.uploader:hover {
  background: #f0f9ff;
}

/* 覆盖 el-upload 的默认样式 */
.uploader :deep(.el-upload-dragger) {
  border: none;
  background: transparent;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.uploader :deep(.el-upload-dragger:hover) {
  border: none;
  background: transparent;
}

/* 调整上传图标大小 */
.uploader :deep(.el-icon--upload) {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.5);
  margin-bottom: 8px;
}

.uploader :deep(.el-upload__text) {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.5);
  margin-bottom: 4px;
}

.el-upload__tip {
  color: #999;
  font-size: 12px;
  margin-top: 8px;
}

/* 分组选择器样式 */
.group-selector {
  border-top: 1px solid #e0e0e0;
  padding: 8px 16px; /* 缩小上下内边距，避免顶栏被挤压 */
  background-color: rgba(245, 245, 245, 0.9);
}

.group-selector-title {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
  font-weight: 500;
}

.group-tabs {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap; /* 允许换行，完整展示 */
}

.group-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
  font-size: 12px;
  transition: background-color 0.2s ease, border-color 0.2s ease,
    color 0.2s ease, box-shadow 0.2s ease, transform 0.12s ease;
  vertical-align: top;
}

.group-tab.more-group-tab {
  background: #f0f0f0;
}

.group-tab:hover {
  background: #e0e0e0;
  border-color: #e0e0e0;
}

.group-tab.active {
  background: #e0e0e0;
  border-color: #e0e0e0;
  color: #333;
}

.group-tab.create-group-tab {
  background: #909399;
  border-color: #909399;
  color: white;
  min-width: 32px;
  justify-content: center;
  padding: 6px;
}

.group-tab.create-group-tab:hover {
  background: #a6a9ad;
  border-color: #a6a9ad;
}

.group-tab .group-name {
  font-weight: 500;
  color: #333;
}

.group-tab .group-count {
  font-size: 11px;
  opacity: 0.8;
}

/* 搜索区域样式 */
.search-area {
  border-top: 1px solid #e0e0e0;
  padding: 16px;
  background-color: rgba(245, 245, 245, 0.9);
}

.search-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.search-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.search-label {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.search-field .el-input {
  width: 100%;
}

.search-field .el-input :deep(.el-input__wrapper) {
  background-color: rgba(250, 250, 250, 0.9);
  border-radius: 100px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: none;
  font-size: 13px;
}

.search-field .el-input :deep(.el-input__inner) {
  font-size: 13px;
  color: #333;
}

.search-field .el-input :deep(.el-input__inner::placeholder) {
  font-size: 12px;
  color: #999;
  font-style: italic;
  font-weight: 400;
}

/* 搜索标签容器样式 */
.tags-container {
  position: relative;
}

.tags-display {
  min-height: 40px;

  background: rgba(245, 245, 245, 0.8);
  border-radius: 100px;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

/* .tags-display:hover {
  background: rgba(255, 255, 255, 0.8);
} */

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

/* 提示文字样式 */
.tag-hint-text {
  color: #8a9ba8;
  font-size: 13px;
  font-style: italic;
  margin-left: 8px;
  user-select: none;
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

.search-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 8px;
}

.search-actions .el-button {
  font-size: 12px;
  padding: 6px 12px;
}

/* 滑动面板动画效果 */
.slide-down-panel {
  overflow: hidden;
}

/* 为不同类型的面板设置合适的最大高度 */
.group-selector.slide-down-panel {
  animation: slideDownGroup 0.3s ease-out;
}

@keyframes slideDownGroup {
  from {
    opacity: 0;
    max-height: 0;
    padding-top: 0;
    padding-bottom: 0;
  }
  to {
    opacity: 1;
    max-height: 100px;
    padding-top: 8px;
    padding-bottom: 8px;
  }
}

.upload-area.slide-down-panel {
  animation: slideDownUpload 0.3s ease-out;
}

@keyframes slideDownUpload {
  from {
    opacity: 0;
    max-height: 0;
    padding-top: 0;
    padding-bottom: 0;
  }
  to {
    opacity: 1;
    max-height: 140px;
    padding-top: 16px;
    padding-bottom: 16px;
  }
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

.search-area.slide-down-panel {
  animation: slideDownSearch 0.3s ease-out;
}

@keyframes slideDownSearch {
  from {
    opacity: 0;
    max-height: 0;
    padding-top: 0;
    padding-bottom: 0;
  }
  to {
    opacity: 1;
    max-height: 300px;
    padding-top: 16px;
    padding-bottom: 16px;
  }
}
</style>
