<template>
  <el-config-provider :locale="locale">
    <!-- 全局背景组件 -->
    <GlobalBackground />

    <!-- 左侧工具栏 - 全局显示 -->
    <div class="app-layout">
      <Sidebar
        :active="activeKey"
        @show-upload="showUploadDialog = true"
        @go-home="goToHome"
        @show-settings="showSettingsPage = true"
        @start-batch-delete="startBatchDelete"
      />

      <!-- 主内容区域 -->
      <div class="main-content">
        <!-- 设置页面 -->
        <SettingsPage
          v-if="showSettingsPage"
          @back="showSettingsPage = false"
          @show-background-settings="showBackgroundSettings = true"
        />

        <!-- 其他页面内容 -->
        <div v-else class="content-scroll">
          <router-view
            :batch-delete-mode="batchDeleteMode"
            :selected-images="selectedImages"
            :groups="groups"
            :selected-group-id="selectedGroupId"
            :show-group-selector="showGroupSelector"
            @toggle-image-selection="toggleImageSelection"
            @clear-selection="clearSelection"
            @batch-delete="handleBatchDelete"
            @show-upload-dialog="showUploadDialog = true"
            @start-batch-delete="startBatchDelete"
            @show-group-selector="showGroupSelector = !showGroupSelector"
            @select-group="handleSelectGroup"
            @show-create-group="showCreateGroupDialog = true"
            @show-group-manage="showGroupManageDialog = true"
          ></router-view>
        </div>
      </div>
    </div>

    <!-- 上传对话框 -->
    <UploadDialog
      v-model:visible="showUploadDialog"
      @file-change="(file) => onFileChange(file, selectedGroupId)"
      @paste-images="(images) => onPasteImages(images, selectedGroupId)"
    />

    <!-- 背景设置对话框 -->
    <BackgroundSettings
      v-model:visible="showBackgroundSettings"
      :background-image="backgroundImage"
      :background-opacity="backgroundOpacity"
      @background-change="onBackgroundChange"
      @opacity-change="onOpacityChange"
      @remove-background="removeBackground"
    />

    <!-- 分组相关对话框 -->
    <GroupDialogs
      v-model:show-create-group="showCreateGroupDialog"
      v-model:show-edit-group="showEditGroupDialog"
      v-model:show-image-group="showImageGroupDialog"
      v-model:new-group="newGroup"
      v-model:editing-group="editingGroup"
      :groups="groups"
      :selected-image-group-id="selectedImageGroupId"
      @create-group="handleCreateGroup"
      @update-group="handleUpdateGroup"
      @delete-group="deleteGroup"
      @select-image-group="selectImageGroup"
      @move-image-to-group="handleMoveImageToGroup"
    />

    <!-- 分组管理对话框（拖拽排序、重命名、拖入删除） -->
    <GroupManageDialog
      v-model:visible="showGroupManageDialog"
      :groups="groups"
      @reorder="handleReorderGroups"
      @rename="handleRenameGroup"
      @delete="handleBulkDeleteGroups"
    />
  </el-config-provider>
</template>

<script setup>
// #region --- element语言
import { ElConfigProvider, ElMessage, ElMessageBox } from "element-plus";
import zhCn from "element-plus/es/locale/lang/zh-cn";
import en from "element-plus/es/locale/lang/en";
import { useSystemLang } from "@/store/system/lang.js";
import { computed, ref, onMounted, watch } from "vue";
import { storeToRefs } from "pinia";
import { useRouter } from "vue-router";

// 组件导入
import GlobalBackground from "@/components/GlobalBackground.vue";
import Sidebar from "@/components/Sidebar.vue";
import SettingsPage from "@/components/SettingsPage.vue";
import UploadDialog from "@/components/UploadDialog.vue";
import BackgroundSettings from "@/components/BackgroundSettings.vue";
import GroupDialogs from "@/components/GroupDialogs.vue";
import GroupManageDialog from "@/components/GroupManageDialog.vue";

// 组合式函数导入
import { useBackground } from "@/composables/useBackground.js";
import { useGroups } from "@/composables/useGroups.js";
import {
  handlePasteEvent,
  processPastedImages,
} from "@/utils/modules/paste.js";
import { putImage } from "@/utils/idb.js";

const router = useRouter();
const systemLang = useSystemLang();
const { currentLang } = storeToRefs(systemLang);

const elLocaleMap = {
  "zh-CN": zhCn,
  "en-US": en,
};

const locale = computed(() => {
  const { locale } = currentLang.value;
  return elLocaleMap[locale] || zhCn;
});
// #endregion

// 页面状态
const showUploadDialog = ref(false);
const showSettingsPage = ref(false);
const showBackgroundSettings = ref(false);
// 已移除独立分组页
const showCreateGroupDialog = ref(false);
const showEditGroupDialog = ref(false);
const showImageGroupDialog = ref(false);
const showGroupManageDialog = ref(false);

// 批量删除相关状态
const batchDeleteMode = ref(false);
const selectedImages = ref(new Set());

// 分组相关状态
const showGroupSelector = ref(false);
const selectedGroupId = ref(0);

// 使用组合式函数
const {
  backgroundImage,
  backgroundOpacity,
  loadBackgroundSettings,
  onBackgroundChange,
  onOpacityChange,
  removeBackground,
} = useBackground();

const {
  groups,
  currentGroupId,
  newGroup,
  editingGroup,
  selectedImageGroupId,
  contextMenuImage,
  selectGroup,
  initializeGroups,
  createGroup,
  showGroupContextMenu,
  updateGroup,
  deleteGroup,
  showImageContextMenu,
  selectImageGroup,
  moveImageToGroup,
  onFileChange,
  onPasteImages,
  reorderGroups,
  renameGroup,
  bulkDeleteGroups,
} = useGroups();

// 计算当前侧边栏激活项
const activeKey = computed(() => {
  if (showSettingsPage.value) return "settings";
  return "home";
});

// 导航到主页
function goToHome() {
  showSettingsPage.value = false;
  batchDeleteMode.value = false;
  selectedImages.value.clear();
  router.push("/gallery");
}

// 开始批量删除模式
function startBatchDelete() {
  showSettingsPage.value = false;
  // 切换开关：再次点击则退出批量模式并清空
  if (batchDeleteMode.value) {
    selectedImages.value.clear();
    batchDeleteMode.value = false;
  } else {
    batchDeleteMode.value = true;
    selectedImages.value.clear();
    router.push("/gallery");
  }
}

// 切换图片选中状态
function toggleImageSelection(imageId) {
  if (selectedImages.value.has(imageId)) {
    selectedImages.value.delete(imageId);
  } else {
    selectedImages.value.add(imageId);
  }
}

// 清空选择
function clearSelection() {
  selectedImages.value.clear();
  batchDeleteMode.value = false;
}

// 处理批量删除
async function handleBatchDelete() {
  if (selectedImages.value.size === 0) {
    ElMessage.warning("请先选择要删除的图片");
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedImages.value.size} 张图片吗？`,
      "确认删除",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }
    );

    // 导入删除函数
    const { deleteImage } = await import("@/utils/idb.js");

    // 批量删除选中的图片
    const deletePromises = Array.from(selectedImages.value).map((imageId) =>
      deleteImage(imageId)
    );

    await Promise.all(deletePromises);

    // 重新统计分组图片数量
    await initializeGroups();

    ElMessage.success(`成功删除 ${selectedImages.value.size} 张图片`);
    selectedImages.value.clear();
    // 保持批量模式开启，不自动关闭

    // 刷新图片列表
    window.dispatchEvent(new CustomEvent("imageAdded"));
  } catch (error) {
    if (error !== "cancel") {
      console.error("批量删除失败:", error);
      ElMessage.error("删除失败，请重试");
    }
  }
}

// 处理分组选择
function handleSelectGroup(groupId) {
  selectedGroupId.value = groupId;
}

// 跳转到详情页
function goToDetail(img) {
  router.push(`/image/${img.id}`);
}

// 处理分组右键菜单
function handleGroupContextMenu(event, group) {
  if (group.id === 0) return;
  editingGroup.value = { ...group };
  showEditGroupDialog.value = true;
}

// 处理图片右键菜单
function handleImageContextMenu(event, img) {
  contextMenuImage.value = img;
  selectedImageGroupId.value = img.groupId || 0;
  showImageGroupDialog.value = true;
}

// 处理新建分组
async function handleCreateGroup() {
  const newId = await createGroup();
  showCreateGroupDialog.value = false; // 关闭对话框
  if (newId !== null && newId !== undefined) {
    // 选中新建分组并保持分组选择器打开
    selectedGroupId.value = newId;
    showGroupSelector.value = true;
  }
}

// 移动图片到分组：成功后关闭弹窗并刷新当前列表
async function handleMoveImageToGroup() {
  await moveImageToGroup();
  showImageGroupDialog.value = false;
  // 通知图片列表刷新
  window.dispatchEvent(new CustomEvent("imageAdded"));
}

// 处理更新分组
async function handleUpdateGroup() {
  await updateGroup();
  showEditGroupDialog.value = false; // 关闭对话框
}

// 分组管理：保存顺序
async function handleReorderGroups(ordered) {
  await reorderGroups(ordered);
  ElMessage.success("分组顺序已保存");
}

// 分组管理：重命名
async function handleRenameGroup(payload) {
  await renameGroup(payload.id, payload.name);
  ElMessage.success("分组已重命名");
}

// 分组管理：批量删除
async function handleBulkDeleteGroups(ids) {
  await bulkDeleteGroups(ids);
  ElMessage.success("分组已删除");
}

// 全局粘贴功能
async function handleGlobalPaste(event) {
  try {
    console.log("全局粘贴监听器被触发");
    const imageFiles = await handlePasteEvent(event);
    if (imageFiles.length > 0) {
      console.log(`检测到 ${imageFiles.length} 个图片文件`);
      const processedImages = await processPastedImages(imageFiles);

      if (processedImages.length > 0) {
        console.log(`处理了 ${processedImages.length} 张图片`);
        // 检查是否在上传弹窗中
        if (showUploadDialog.value) {
          console.log("在弹窗中，通过事件系统处理");
          // 在弹窗中，通过emit传递给弹窗处理
          // 这里我们需要通过事件系统通知弹窗
          window.dispatchEvent(
            new CustomEvent("pasteImagesInDialog", {
              detail: { processedImages },
            })
          );
        } else {
          console.log("不在弹窗中，直接处理");
          // 不在弹窗中，直接处理，使用当前选中的分组ID
          await onPasteImages(processedImages, selectedGroupId.value);
        }
      }
    }
  } catch (error) {
    console.error("处理全局粘贴事件时出错:", error);
    ElMessage.error("粘贴失败，请重试");
  }
}

onMounted(() => {
  loadBackgroundSettings();
  initializeGroups();

  // 监听来自图片库的显示分组对话框事件
  window.addEventListener("showImageGroupDialog", (event) => {
    contextMenuImage.value = event.detail.image;
    selectedImageGroupId.value = event.detail.image.groupId || 0;
    showImageGroupDialog.value = true;
  });

  // 添加全局粘贴事件监听器，使用 capture 模式
  document.addEventListener("paste", handleGlobalPaste, true);
});
</script>

<style scoped>
.app-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
  margin: 0;
  padding: 0;
  position: relative;
}

.main-content {
  flex: 1;
  overflow-y: hidden; /* 右侧整体不滚动，交给内部列表滚动 */
  min-height: 0;
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
}

.content-scroll {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
</style>
