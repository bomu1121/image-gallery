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
        @show-groups="showGroupsPage = true"
        @show-settings="showSettingsPage = true"
      />

      <!-- 主内容区域 -->
      <div class="main-content">
        <!-- 设置页面 -->
        <SettingsPage
          v-if="showSettingsPage"
          @back="showSettingsPage = false"
          @show-background-settings="showBackgroundSettings = true"
        />

        <!-- 分组页面 -->
        <GroupsPage
          v-else-if="showGroupsPage"
          :groups="groups"
          :current-group-id="currentGroupId"
          :current-group-images="currentGroupImages"
          @show-create-group="showCreateGroupDialog = true"
          @select-group="selectGroup"
          @show-group-context-menu="handleGroupContextMenu"
          @go-to-detail="goToDetail"
          @show-image-context-menu="handleImageContextMenu"
        />

        <!-- 其他页面内容 -->
        <div v-else>
          <router-view></router-view>
        </div>
      </div>
    </div>

    <!-- 上传对话框 -->
    <UploadDialog
      v-model:visible="showUploadDialog"
      @file-change="onFileChange"
      @paste-images="onPasteImages"
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
      @move-image-to-group="moveImageToGroup"
    />
  </el-config-provider>
</template>

<script setup>
// #region --- element语言
import { ElConfigProvider, ElMessage } from "element-plus";
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
import GroupsPage from "@/components/GroupsPage.vue";
import UploadDialog from "@/components/UploadDialog.vue";
import BackgroundSettings from "@/components/BackgroundSettings.vue";
import GroupDialogs from "@/components/GroupDialogs.vue";

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
const showGroupsPage = ref(false);
const showCreateGroupDialog = ref(false);
const showEditGroupDialog = ref(false);
const showImageGroupDialog = ref(false);

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
  currentGroupImages,
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
} = useGroups();

// 计算当前侧边栏激活项
const activeKey = computed(() => {
  if (showSettingsPage.value) return "settings";
  if (showGroupsPage.value) return "groups";
  return "home";
});

// 导航到主页
function goToHome() {
  showSettingsPage.value = false;
  showGroupsPage.value = false;
  router.push("/gallery");
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
  await createGroup();
  showCreateGroupDialog.value = false; // 关闭对话框
}

// 处理更新分组
async function handleUpdateGroup() {
  await updateGroup();
  showEditGroupDialog.value = false; // 关闭对话框
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
          // 不在弹窗中，直接处理
          await onPasteImages(processedImages);
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

// 当进入分组页时，主动加载未分组图片
watch(showGroupsPage, (isShown) => {
  if (isShown) {
    // 延后到下一个事件循环，避免阻塞选中态渲染
    setTimeout(() => {
      selectGroup(0);
    }, 0);
  }
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
  overflow-y: auto;
  min-height: 0;
  position: relative;
  z-index: 2;
}
</style>
