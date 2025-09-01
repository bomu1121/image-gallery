<template>
  <el-config-provider :locale="locale">
    <!-- 全局背景组件 -->
    <GlobalBackground />

    <!-- 左侧工具栏 - 全局显示 -->
    <div class="app-layout">
      <div class="sidebar">
        <div class="sidebar-top">
          <div
            class="sidebar-item"
            @click="showUploadDialog = true"
            title="上传图片"
          >
            <el-icon><icon-upload /></el-icon>
          </div>

          <div class="sidebar-item" @click="goToHome" title="回到主页">
            <el-icon><icon-home /></el-icon>
          </div>

          <div
            class="sidebar-item"
            @click="showGroupsPage = true"
            title="分组管理"
          >
            <el-icon><icon-folder /></el-icon>
          </div>
        </div>

        <div class="sidebar-bottom">
          <div
            class="sidebar-item"
            @click="showSettingsPage = true"
            title="设置"
          >
            <el-icon><icon-setting /></el-icon>
          </div>
        </div>
      </div>

      <!-- 主内容区域 -->
      <div class="main-content">
        <!-- 设置页面 -->
        <div v-if="showSettingsPage" class="settings-page">
          <div class="settings-header">
            <el-button @click="showSettingsPage = false" type="text">
              <el-icon><icon-arrow-left /></el-icon>
              返回
            </el-button>
            <h2>设置</h2>
          </div>

          <div class="settings-content">
            <div class="setting-section">
              <div class="setting-item" @click="showBackgroundSettings = true">
                <div class="setting-info">
                  <el-icon class="setting-icon"><icon-picture /></el-icon>
                  <div class="setting-text">
                    <h3>背景设置</h3>
                    <p>自定义应用背景图片和透明度</p>
                  </div>
                </div>
                <el-icon class="setting-arrow"><icon-arrow-right /></el-icon>
              </div>
            </div>
          </div>
        </div>

        <!-- 分组页面 -->
        <div v-else-if="showGroupsPage" class="groups-page">
          <!-- 分组标签栏 -->
          <div class="groups-tabs">
            <!-- 新建分组按钮 -->
            <div
              class="group-tab create-group-tab"
              @click="showCreateGroupDialog = true"
            >
              <el-icon><icon-plus /></el-icon>
            </div>

            <!-- 分组标签 -->
            <div
              v-for="group in groups"
              :key="group.id"
              class="group-tab"
              :class="{ active: currentGroupId === group.id }"
              @click="selectGroup(group.id)"
              @contextmenu.prevent="showGroupContextMenu($event, group)"
            >
              <span class="group-name">{{ group.name }}</span>
              <span class="group-count">({{ group.imageCount }})</span>
            </div>
          </div>

          <!-- 图片展示区域 -->
          <div class="groups-content">
            <div v-if="!currentGroupImages.length" class="empty">
              <el-empty description="该分组暂无图片" />
            </div>

            <div class="grid" v-else>
              <div v-for="img in currentGroupImages" :key="img.id" class="card">
                <img
                  :src="img.objectUrl || img.url"
                  :alt="img.name"
                  @click="goToDetail(img)"
                  @contextmenu.prevent="showImageContextMenu($event, img)"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- 其他页面内容 -->
        <div v-else>
          <router-view></router-view>
        </div>
      </div>
    </div>

    <!-- 上传对话框 -->
    <el-dialog v-model="showUploadDialog" title="上传图片" width="500px">
      <el-upload
        class="uploader"
        drag
        :auto-upload="false"
        :show-file-list="false"
        accept="image/*"
        :on-change="onFileChange"
      >
        <el-icon class="el-icon--upload"><icon-upload /></el-icon>
        <div class="el-upload__text">拖拽图片到此处，或点击选择</div>
      </el-upload>
    </el-dialog>

    <!-- 背景设置对话框 -->
    <el-dialog v-model="showBackgroundSettings" title="背景设置" width="600px">
      <div class="background-settings-content">
        <div class="setting-section">
          <h3>背景设置</h3>
          <div class="background-upload">
            <el-upload
              class="background-uploader"
              drag
              :auto-upload="false"
              :show-file-list="false"
              accept="image/*"
              :on-change="onBackgroundChange"
            >
              <div v-if="!backgroundImage" class="upload-placeholder">
                <el-icon class="el-icon--upload"><icon-upload /></el-icon>
                <div class="el-upload__text">
                  拖拽背景图片到此处，或点击选择
                </div>
              </div>
              <div v-else class="background-preview">
                <img :src="backgroundImage" alt="背景预览" />
                <div class="background-overlay">
                  <el-button
                    type="danger"
                    size="small"
                    @click="removeBackground"
                  >
                    移除背景
                  </el-button>
                </div>
              </div>
            </el-upload>
          </div>

          <div v-if="backgroundImage" class="opacity-control">
            <label
              >背景透明度：{{ Math.round(backgroundOpacity * 100) }}%</label
            >
            <el-slider
              v-model="backgroundOpacity"
              :min="0.1"
              :max="1"
              :step="0.1"
              show-input
              input-size="small"
            />
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 新建分组对话框 -->
    <el-dialog v-model="showCreateGroupDialog" title="新建分组" width="500px">
      <div class="create-group-content">
        <el-form :model="newGroup" label-width="80px">
          <el-form-item label="分组名称">
            <el-input v-model="newGroup.name" placeholder="请输入分组名称" />
          </el-form-item>
          <el-form-item label="分组描述">
            <el-input
              v-model="newGroup.description"
              type="textarea"
              :rows="3"
              placeholder="请输入分组描述（可选）"
            />
          </el-form-item>
        </el-form>
        <div class="dialog-footer">
          <el-button @click="showCreateGroupDialog = false">取消</el-button>
          <el-button type="primary" @click="createGroup">确定</el-button>
        </div>
      </div>
    </el-dialog>

    <!-- 编辑分组对话框 -->
    <el-dialog v-model="showEditGroupDialog" title="编辑分组" width="500px">
      <div class="edit-group-content">
        <el-form :model="editingGroup" label-width="80px">
          <el-form-item label="分组名称">
            <el-input
              v-model="editingGroup.name"
              placeholder="请输入分组名称"
            />
          </el-form-item>
          <el-form-item label="分组描述">
            <el-input
              v-model="editingGroup.description"
              type="textarea"
              :rows="3"
              placeholder="请输入分组描述（可选）"
            />
          </el-form-item>
        </el-form>
        <div class="dialog-footer">
          <el-button @click="showEditGroupDialog = false">取消</el-button>
          <el-button type="danger" @click="deleteGroup">删除分组</el-button>
          <el-button type="primary" @click="updateGroup">保存</el-button>
        </div>
      </div>
    </el-dialog>

    <!-- 图片分组选择对话框 -->
    <el-dialog v-model="showImageGroupDialog" title="选择分组" width="400px">
      <div class="image-group-content">
        <div class="group-options">
          <div
            v-for="group in groups"
            :key="group.id"
            class="group-option"
            :class="{ selected: selectedImageGroupId === group.id }"
            @click="selectImageGroup(group.id)"
          >
            <el-icon><icon-folder /></el-icon>
            <span class="group-name">{{ group.name }}</span>
            <span class="group-count">({{ group.imageCount }})</span>
          </div>
        </div>
        <div class="dialog-footer">
          <el-button @click="showImageGroupDialog = false">取消</el-button>
          <el-button type="primary" @click="moveImageToGroup">确定</el-button>
        </div>
      </div>
    </el-dialog>
  </el-config-provider>
</template>

<script setup>
// #region --- element语言
import {
  ElConfigProvider,
  ElUpload,
  ElButton,
  ElIcon,
  ElDialog,
  ElSlider,
  ElForm,
  ElFormItem,
  ElInput,
  ElEmpty,
  ElMessage,
  ElMessageBox,
} from "element-plus";
import zhCn from "element-plus/es/locale/lang/zh-cn";
import en from "element-plus/es/locale/lang/en";
import { useSystemLang } from "@/store/system/lang.js";
import { computed, ref, watch, onMounted } from "vue";
import { storeToRefs } from "pinia";
import GlobalBackground from "@/components/GlobalBackground.vue";
import {
  Upload as IconUpload,
  Setting as IconSetting,
  ArrowLeft as IconArrowLeft,
  ArrowRight as IconArrowRight,
  Picture as IconPicture,
  Grid as IconHome,
  Folder as IconFolder,
  Plus as IconPlus,
} from "@element-plus/icons-vue";
import { putImage } from "@/utils/idb.js";
import { useRouter } from "vue-router";

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

// 全局状态
const showUploadDialog = ref(false);
const showSettingsPage = ref(false);
const showBackgroundSettings = ref(false);
const showGroupsPage = ref(false);
const showCreateGroupDialog = ref(false);
const showEditGroupDialog = ref(false);
const showImageGroupDialog = ref(false);

// 背景设置相关
const backgroundImage = ref(null);
const backgroundOpacity = ref(0.3);

// 分组相关
const groups = ref([
  { id: 0, name: "未分组", description: "默认分组", imageCount: 0 },
]);
const currentGroupId = ref(0);
const currentGroupImages = ref([]);
const newGroup = ref({ name: "", description: "" });
const editingGroup = ref({ id: null, name: "", description: "" });
const selectedImageGroupId = ref(0);
const contextMenuImage = ref(null);

// 背景设置持久化
function saveBackgroundSettings() {
  if (backgroundImage.value) {
    localStorage.setItem("backgroundImage", backgroundImage.value);
    localStorage.setItem(
      "backgroundOpacity",
      backgroundOpacity.value.toString()
    );
  } else {
    localStorage.removeItem("backgroundImage");
    localStorage.removeItem("backgroundOpacity");
    backgroundImage.value = null;
    backgroundOpacity.value = 0.3;
  }
}

function loadBackgroundSettings() {
  const savedImage = localStorage.getItem("backgroundImage");
  const savedOpacity = localStorage.getItem("backgroundOpacity");

  if (savedImage) {
    backgroundImage.value = savedImage;
  }
  if (savedOpacity) {
    backgroundOpacity.value = parseFloat(savedOpacity);
  }
}

// 监听透明度变化，自动保存
watch(backgroundOpacity, () => {
  if (backgroundImage.value) {
    saveBackgroundSettings();
    window.dispatchEvent(new CustomEvent("backgroundSettingsChanged"));
  }
});

// 监听分组页面显示状态，自动初始化数据
watch(showGroupsPage, async (newValue) => {
  if (newValue) {
    await initializeGroups();
    if (currentGroupId.value === 0) {
      await loadGroupImages(0);
    }
  }
});

// 导航到主页
function goToHome() {
  showSettingsPage.value = false; // 如果当前在设置页面，先关闭设置
  showGroupsPage.value = false; // 如果当前在分组页面，先关闭分组页面
  router.push("/gallery");
}

// 分组管理函数
async function selectGroup(groupId) {
  currentGroupId.value = groupId;
  await loadGroupImages(groupId);
}

// 初始化分组数据
async function initializeGroups() {
  try {
    // 从数据库加载所有图片
    const { getAllImages } = await import("@/utils/idb.js");
    const allImages = await getAllImages();

    // 计算每个分组的图片数量
    const groupCounts = {};
    allImages.forEach((img) => {
      const groupId = img.groupId || 0;
      groupCounts[groupId] = (groupCounts[groupId] || 0) + 1;
    });

    // 更新分组数据
    groups.value.forEach((group) => {
      group.imageCount = groupCounts[group.id] || 0;
    });
  } catch (error) {
    console.error("初始化分组数据失败:", error);
  }
}

async function loadGroupImages(groupId) {
  try {
    // 从数据库加载所有图片
    const { getAllImages } = await import("@/utils/idb.js");
    const allImages = await getAllImages();

    // 过滤出指定分组的图片
    const groupImages = allImages.filter(
      (img) => (img.groupId || 0) === groupId
    );

    // 为图片创建 objectUrl
    currentGroupImages.value = groupImages.map((img) => ({
      ...img,
      objectUrl: img.blob ? URL.createObjectURL(img.blob) : img.url,
    }));

    // 更新分组的图片数量
    const group = groups.value.find((g) => g.id === groupId);
    if (group) {
      group.imageCount = groupImages.length;
    }
  } catch (error) {
    console.error("加载分组图片失败:", error);
    currentGroupImages.value = [];
  }
}

function createGroup() {
  if (!newGroup.value.name.trim()) {
    ElMessage.warning("请输入分组名称");
    return;
  }

  const group = {
    id: Date.now(),
    name: newGroup.value.name.trim(),
    description: newGroup.value.description.trim(),
    imageCount: 0,
  };

  groups.value.push(group);
  newGroup.value = { name: "", description: "" };
  showCreateGroupDialog.value = false;
  ElMessage.success("分组创建成功");
}

function showGroupContextMenu(event, group) {
  if (group.id === 0) return; // 未分组不能编辑

  editingGroup.value = { ...group };
  showEditGroupDialog.value = true;
}

function updateGroup() {
  if (!editingGroup.value.name.trim()) {
    ElMessage.warning("请输入分组名称");
    return;
  }

  const index = groups.value.findIndex((g) => g.id === editingGroup.value.id);
  if (index !== -1) {
    groups.value[index] = { ...editingGroup.value };
    ElMessage.success("分组更新成功");
    showEditGroupDialog.value = false;
  }
}

function deleteGroup() {
  ElMessageBox.confirm(
    "确定要删除这个分组吗？删除后分组内的图片将移动到未分组。",
    "确认删除",
    {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    }
  )
    .then(() => {
      const deletedGroup = editingGroup.value;
      const index = groups.value.findIndex((g) => g.id === deletedGroup.id);
      if (index !== -1) {
        // 将删除分组的图片数量添加到未分组
        const ungroupedGroup = groups.value.find((g) => g.id === 0);
        if (ungroupedGroup) {
          ungroupedGroup.imageCount += deletedGroup.imageCount;
        }

        groups.value.splice(index, 1);
        ElMessage.success("分组删除成功");
        showEditGroupDialog.value = false;

        if (currentGroupId.value === deletedGroup.id) {
          currentGroupId.value = 0;
          loadGroupImages(0);
        }
      }
    })
    .catch(() => {
      // 用户取消
    });
}

function showImageContextMenu(event, img) {
  contextMenuImage.value = img;
  selectedImageGroupId.value = img.groupId || 0;
  showImageGroupDialog.value = true;
}

function selectImageGroup(groupId) {
  selectedImageGroupId.value = groupId;
}

async function moveImageToGroup() {
  if (!contextMenuImage.value) return;

  const oldGroupId = contextMenuImage.value.groupId || 0;
  const newGroupId = selectedImageGroupId.value;

  if (oldGroupId === newGroupId) {
    ElMessage.warning("图片已在当前分组中");
    return;
  }

  try {
    // 更新数据库中的图片分组信息
    const { updateImage } = await import("@/utils/idb.js");
    await updateImage(contextMenuImage.value.id, { groupId: newGroupId });

    // 更新内存中的图片分组信息
    contextMenuImage.value.groupId = newGroupId;

    // 更新分组图片数量
    const oldGroup = groups.value.find((g) => g.id === oldGroupId);
    const newGroup = groups.value.find((g) => g.id === newGroupId);

    if (oldGroup) {
      oldGroup.imageCount = Math.max(0, oldGroup.imageCount - 1);
    }
    if (newGroup) {
      newGroup.imageCount++;
    }

    ElMessage.success("图片已移动到指定分组");
    showImageGroupDialog.value = false;

    // 重新加载当前分组的图片
    await loadGroupImages(currentGroupId.value);
  } catch (error) {
    console.error("移动图片失败:", error);
    ElMessage.error("移动图片失败，请重试");
  }
}

function goToDetail(img) {
  router.push(`/image/${img.id}`);
}

// 文件上传处理
async function onFileChange(file) {
  try {
    const raw = file.raw;
    if (!raw) return;
    const arrayBuffer = await raw.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: raw.type || "image/*" });
    const record = {
      name: raw.name,
      type: raw.type,
      size: raw.size,
      blob,
      groupId: 0, // 新上传的图片默认归类到"未分组"
    };
    await putImage(record);
    showUploadDialog.value = false;

    // 更新未分组的图片数量
    const ungroupedGroup = groups.value.find((g) => g.id === 0);
    if (ungroupedGroup) {
      ungroupedGroup.imageCount++;
    }

    // 如果当前在分组页面且显示的是未分组，刷新图片显示
    if (showGroupsPage.value && currentGroupId.value === 0) {
      await loadGroupImages(0);
    }

    // 触发图片库刷新事件
    window.dispatchEvent(new CustomEvent("imageAdded"));

    // 如果当前在图片库页面，跳转回去
    if (window.location.pathname !== "/gallery") {
      window.location.href = "/gallery";
    }
  } catch (e) {
    console.error("上传失败:", e);
  }
}

// 背景设置相关函数
async function onBackgroundChange(file) {
  try {
    const raw = file.raw;
    if (!raw) return;

    const arrayBuffer = await raw.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: raw.type || "image/*" });
    const objectUrl = URL.createObjectURL(blob);

    backgroundImage.value = objectUrl;
    saveBackgroundSettings();

    window.dispatchEvent(new CustomEvent("backgroundSettingsChanged"));
  } catch (e) {
    console.error("背景设置失败:", e);
  }
}

function removeBackground() {
  if (backgroundImage.value) {
    URL.revokeObjectURL(backgroundImage.value);
    backgroundImage.value = null;

    saveBackgroundSettings();
    window.dispatchEvent(new CustomEvent("backgroundSettingsChanged"));
  }
}

onMounted(() => {
  loadBackgroundSettings();
  initializeGroups(); // 初始化分组数据

  // 监听来自图片库的显示分组对话框事件
  window.addEventListener("showImageGroupDialog", (event) => {
    contextMenuImage.value = event.detail.image;
    selectedImageGroupId.value = event.detail.image.groupId || 0;
    showImageGroupDialog.value = true;
  });
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

.sidebar {
  width: 60px;
  background: rgba(245, 245, 245, 0.9);
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 0;
  gap: 8px;
  position: relative;
  z-index: 10;
}

.sidebar-top {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.sidebar-bottom {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.sidebar-item {
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

.sidebar-item:hover {
  background: #e0e0e0;
  color: #333;
}

.main-content {
  flex: 1;
  overflow: hidden;
  min-height: 0;
  position: relative;
  z-index: 2;
}

/* 设置页面样式 */
.settings-page {
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
  height: 100%;
  overflow-y: auto;
}

.settings-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.settings-header h2 {
  margin: 0;
  color: #333;
  font-size: 24px;
  font-weight: 600;
}

.settings-content {
  padding: 20px 0;
}

.setting-section {
  margin-bottom: 24px;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
}

.setting-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
  transform: translateY(-1px);
}

.setting-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.setting-icon {
  font-size: 24px;
  color: #409eff;
  background: rgba(64, 158, 255, 0.1);
  padding: 12px;
  border-radius: 8px;
}

.setting-text h3 {
  margin: 0 0 4px 0;
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

.setting-text p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.setting-arrow {
  font-size: 16px;
  color: #999;
}

/* 分组页面样式 */
.groups-page {
  padding: 24px;
  height: 100%;
  overflow-y: auto;
}

.groups-tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.group-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.group-tab:hover {
  background: #e8f4fd;
  border-color: #409eff;
}

.group-tab.active {
  background: #409eff;
  border-color: #409eff;
  color: white;
}

.group-tab.create-group-tab {
  background: #67c23a;
  border-color: #67c23a;
  color: white;
  min-width: 40px;
  justify-content: center;
}

.group-tab.create-group-tab:hover {
  background: #85ce61;
  border-color: #85ce61;
}

.group-name {
  font-weight: 500;
}

.group-count {
  font-size: 12px;
  opacity: 0.8;
}

.groups-content {
  flex: 1;
  padding: 16px;
}

/* 分组对话框样式 */
.create-group-content,
.edit-group-content,
.image-group-content {
  padding: 20px 0;
}

.dialog-footer {
  text-align: right;
  margin-top: 20px;
}

.group-options {
  max-height: 300px;
  overflow-y: auto;
}

.group-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 8px;
}

.group-option:hover {
  background: #f5f5f5;
  border-color: #409eff;
}

.group-option.selected {
  background: #e8f4fd;
  border-color: #409eff;
}

.group-option .el-icon {
  color: #409eff;
  font-size: 18px;
}

.group-option .group-name {
  flex: 1;
  font-weight: 500;
}

.group-option .group-count {
  font-size: 12px;
  color: #666;
}

/* 图片展示样式 - 复用主页面的瀑布流布局 */
.grid {
  column-count: 3;
  column-gap: 12px;
  padding: 16px 0;
}

.card {
  border: 1px solid #eee;
  border-radius: 6px;
  overflow: hidden;
  background: #fff;
  width: 100%;
  break-inside: avoid;
  margin-bottom: 12px;
}

.card img {
  display: block;
  width: 100%;
  height: auto;
  object-fit: cover;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.card img:hover {
  /* transform: scale(1.05); */
}

.empty {
  color: #888;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

/* 设置对话框样式 */
.background-settings-content {
  padding: 20px 0;
}

.setting-section {
  margin-bottom: 24px;
}

.setting-section h3 {
  margin-bottom: 16px;
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

.background-upload {
  margin-bottom: 20px;
}

.background-uploader {
  border: 2px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: border-color 0.3s;
}

.background-uploader:hover {
  border-color: #409eff;
}

.upload-placeholder {
  padding: 40px 20px;
  text-align: center;
  color: #666;
}

.background-preview {
  position: relative;
  height: 200px;
  overflow: hidden;
  border-radius: 6px;
}

.background-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.background-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.background-preview:hover .background-overlay {
  opacity: 1;
}

.opacity-control {
  margin-top: 16px;
}

.opacity-control label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: 500;
}
</style>
