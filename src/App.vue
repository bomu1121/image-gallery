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
} from "@element-plus/icons-vue";
import { putImage } from "@/utils/idb.js";

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

// 背景设置相关
const backgroundImage = ref(null);
const backgroundOpacity = ref(0.3);

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
    };
    await putImage(record);
    showUploadDialog.value = false;

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
