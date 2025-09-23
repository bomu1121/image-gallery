<template>
  <el-config-provider :locale="locale">
    <!-- 全局背景组件 -->
    <GlobalBackground />

    <!-- 左侧工具栏 - 全局显示 -->
    <div class="app-layout">
      <Sidebar
        :active="activeKey"
        @go-home="goToHome"
        @show-settings="showSettingsPage = true"
        @showAIAnalysisLogs="goToAIAnalysisLogs"
        @start-batch-delete="startBatchDelete"
      />

      <!-- 主内容区域 -->
      <div class="main-content">
        <!-- 设置页面 -->
        <SettingsPage
          v-if="showSettingsPage"
          :background-image="backgroundImage"
          :background-opacity="backgroundOpacity"
          :groups="groups"
          @background-change="onBackgroundChange"
          @opacity-change="onOpacityChange"
          @remove-background="removeBackground"
          @data-imported="handleDataImported"
          @data-exported="handleDataExported"
        />

        <!-- 其他页面内容 -->
        <div v-else class="content-scroll">
          <router-view
            :batch-delete-mode="batchDeleteMode"
            :album-mode="albumMode"
            :selected-images="selectedImages"
            :groups="groups"
            :selected-group-id="selectedGroupId"
            :show-group-selector="showGroupSelector"
            :upload-mode="uploadMode"
            @toggle-image-selection="toggleImageSelection"
            @clear-selection="clearSelection"
            @batch-delete="handleBatchDelete"
            @start-batch-delete="startBatchDelete"
            @start-album-mode="toggleAlbumMode"
            @show-group-selector="toggleGroupSelector"
            @select-group="handleSelectGroup"
            @show-create-group="showCreateGroupDialog = true"
            @show-group-manage="showGroupManageDialog = true"
            @toggle-upload-mode="toggleUploadMode"
            @file-change="(file) => onFileChange(file, selectedGroupId)"
            @create-album-from-selection="createAlbumFromSelection"
          ></router-view>
        </div>
      </div>
    </div>

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

    <!-- 通知容器 -->
    <NotificationContainer />

    <!-- 组图选择/新建弹窗 -->
    <el-dialog v-model="showAlbumDialog" title="添加到组图" width="420px">
      <div class="album-dialog-body">
        <div class="field">
          <div class="label">选择已有相册</div>
          <el-select
            v-model="selectedAlbumId"
            placeholder="选择相册"
            clearable
            style="width: 100%"
          >
            <el-option
              v-for="a in albumList"
              :key="a.id"
              :label="a.name"
              :value="a.id"
            />
          </el-select>
        </div>
        <div class="field">
          <div class="label">或新建相册</div>
          <el-input v-model="newAlbumName" placeholder="输入新相册名称" />
        </div>
      </div>
      <template #footer>
        <el-button @click="cancelAlbumDialog">取消</el-button>
        <el-button type="primary" @click="confirmAddToAlbum">确定</el-button>
      </template>
    </el-dialog>
  </el-config-provider>
</template>

<script setup>
// #region --- element语言
import { ElConfigProvider, ElMessageBox } from "element-plus";
import { useDrawerNotification } from "@/composables/useDrawerNotification.js";
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
import GroupDialogs from "@/components/GroupDialogs.vue";
import GroupManageDialog from "@/components/GroupManageDialog.vue";
import NotificationContainer from "@/components/NotificationContainer.vue";

// 组合式函数导入
import { useBackground } from "@/composables/useBackground.js";
import { useGroups } from "@/composables/useGroups.js";
import {
  handlePasteEvent,
  processPastedImages,
} from "@/utils/modules/paste.js";
import { putImage } from "@/utils/idb.js";
import { updateImage, getImageById } from "@/utils/idb.js";
import "@/utils/logManager.js"; // 初始化全局日志管理器
import { aiImageAnalysisService } from "@/services/AIImageAnalysisService.js";

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

// #region --- 通知设置
const { success, error, warning, info } = useDrawerNotification();
// #endregion

// 页面状态
const showSettingsPage = ref(false);
// 已移除独立分组页
const showCreateGroupDialog = ref(false);
const showEditGroupDialog = ref(false);
const showImageGroupDialog = ref(false);
const showGroupManageDialog = ref(false);
// 模式：批量删除 or 组图模式（互斥）
const albumMode = ref(false);
// 取消选择相册弹窗逻辑，改为直接创建相册

// 批量删除相关状态
const batchDeleteMode = ref(false);
const selectedImages = ref(new Set());

// 上传相关状态
const uploadMode = ref(false);

// 分组相关状态
const showGroupSelector = ref(false);
const selectedGroupId = ref(-1);

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
  if (router.currentRoute.value.path === "/ai-analysis-logs")
    return "ai-analysis-logs";
  return "home";
});

// 导航到主页
function goToHome() {
  showSettingsPage.value = false;
  // 注意：不重置 batchDeleteMode 和 selectedImages，保持用户的操作状态
  // 只有在用户主动退出批量删除模式时才重置这些状态
  router.push("/gallery");
}

// 导航到AI日志页面
function goToAIAnalysisLogs() {
  console.log("🚀 点击AI分析日志按钮，准备跳转");
  console.log("📍 当前路由:", router.currentRoute.value.path);
  showSettingsPage.value = false;
  router
    .push("/ai-analysis-logs")
    .then(() => {
      console.log("✅ 路由跳转完成，新路由:", router.currentRoute.value.path);
    })
    .catch((error) => {
      console.error("❌ 路由跳转失败:", error);
    });
}

// 开始批量删除模式
function startBatchDelete() {
  showSettingsPage.value = false;
  // 切换开关：再次点击则退出批量模式并清空
  if (batchDeleteMode.value) {
    selectedImages.value.clear();
    batchDeleteMode.value = false;
  } else {
    albumMode.value = false; // 互斥
    batchDeleteMode.value = true;
    selectedImages.value.clear();
    router.push("/gallery");
  }
}
// 切换组图模式（与批量删除互斥，共用面板区域）
function toggleAlbumMode() {
  showSettingsPage.value = false;
  if (albumMode.value) {
    selectedImages.value.clear();
    albumMode.value = false;
  } else {
    batchDeleteMode.value = false; // 互斥
    albumMode.value = true;
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
  // 不再自动关闭批量删除模式，让用户手动控制
  // batchDeleteMode.value = false;
}

// 处理批量删除
async function handleBatchDelete() {
  if (selectedImages.value.size === 0) {
    warning("请先选择要删除的图片");
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

    success(`成功删除 ${selectedImages.value.size} 张图片`);
    selectedImages.value.clear();
    // 保持批量模式开启，不自动关闭

    // 刷新图片列表
    window.dispatchEvent(new CustomEvent("imageAdded"));
  } catch (err) {
    if (err !== "cancel") {
      console.error("批量删除失败:", err);
      error("删除失败，请重试");
    }
  }
}

// 处理分组选择
function handleSelectGroup(groupId) {
  selectedGroupId.value = groupId;
}

// 切换上传模式
function toggleUploadMode() {
  // 切换上传模式
  uploadMode.value = !uploadMode.value;
}

// 切换分组选择器
function toggleGroupSelector() {
  // 切换分组选择器
  showGroupSelector.value = !showGroupSelector.value;
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
  success("分组顺序已保存");
}

// 分组管理：重命名
async function handleRenameGroup(payload) {
  await renameGroup(payload.id, payload.name);
  success("分组已重命名");
}

// 分组管理：批量删除
async function handleBulkDeleteGroups(ids) {
  await bulkDeleteGroups(ids);
  success("分组已删除");
}

// 处理数据导入事件
async function handleDataImported(type) {
  console.log(`数据导入完成: ${type}`);
  // 重新初始化分组数据以刷新UI
  await initializeGroups();
  // 触发图片库刷新事件
  window.dispatchEvent(new CustomEvent("imageAdded"));
}

// 处理数据导出事件
function handleDataExported(type) {
  console.log(`数据导出完成: ${type}`);
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
        console.log("直接处理粘贴的图片");
        // 直接处理，使用当前选中的分组ID
        await onPasteImages(processedImages, selectedGroupId.value);
      }
    }
  } catch (err) {
    console.error("处理全局粘贴事件时出错:", err);
    error("粘贴失败，请重试");
  }
}

onMounted(async () => {
  loadBackgroundSettings();
  await initializeGroups();

  // 监听来自图片库的显示分组对话框事件
  window.addEventListener("showImageGroupDialog", (event) => {
    contextMenuImage.value = event.detail.image;
    selectedImageGroupId.value = event.detail.image.groupId || 0;
    showImageGroupDialog.value = true;
  });

  // 监听图片变化事件，更新分组数量
  window.addEventListener("imageAdded", async () => {
    await initializeGroups();
  });

  // 添加全局粘贴事件监听器，使用 capture 模式
  document.addEventListener("paste", handleGlobalPaste, true);

  // 加载AI服务配置并初始化
  aiImageAnalysisService.loadConfigFromStorage();
  await aiImageAnalysisService.initialize();
  console.log("✅ AI分析服务初始化完成");
});
// 直接创建相册：封面=第一张、继承其分组
async function createAlbumFromSelection() {
  if (selectedImages.value.size === 0) {
    warning("请先选择图片");
    return;
  }
  try {
    const ids = Array.from(selectedImages.value);
    const coverImageId = ids[0];
    // 读取封面图，继承其分组与标签
    const coverImg = await getImageById(coverImageId);
    const groupId = coverImg?.groupId ?? null;
    const tags = Array.isArray(coverImg?.tags) ? [...coverImg.tags] : [];

    // 将其余图片挂到主图下，并继承分组与标签
    const children = ids.slice(1);
    if (children.length > 0) {
      await Promise.all(
        children.map((id) =>
          updateImage(id, { parentImageId: coverImageId, groupId, tags })
        )
      );
    }

    success("组图已创建");
    // 退出组图模式并清空选择
    albumMode.value = false;
    selectedImages.value.clear();
    // 刷新用于徽标的计数（触发列表刷新）
    window.dispatchEvent(new CustomEvent("imageAdded"));
  } catch (e) {
    console.error(e);
    error("创建组图失败");
  }
}
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
  overflow-y: auto; /* 允许垂直滚动 */
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
