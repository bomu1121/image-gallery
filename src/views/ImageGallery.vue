<template>
  <div class="app-layout">
    <!-- 左侧工具栏 -->
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
        <div class="sidebar-item" @click="showSettingsPage = true" title="设置">
          <el-icon><icon-setting /></el-icon>
        </div>
      </div>
    </div>

    <!-- 主内容区域 -->
    <div class="main-content">
      <!-- 图片库页面 -->
      <div v-if="!showSettingsPage" class="gallery-page">
        <div v-if="!images.length" class="empty">
          <!-- <el-empty description="暂无图片，请先上传" /> -->
        </div>

        <div class="grid" v-else>
          <div v-for="img in images" :key="img.id" class="card">
            <img
              :src="img.objectUrl || img.url"
              :alt="img.name"
              @click="goToDetail(img)"
              @contextmenu.prevent="showContextMenu($event, img)"
            />
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
          <div
            class="context-menu-item"
            @click="downloadImage(contextMenuImage)"
          >
            <el-icon><icon-download /></el-icon>
            <span>下载</span>
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
      </div>

      <!-- 设置页面 -->
      <div v-else class="settings-page">
        <div class="settings-header">
          <el-button @click="showSettingsPage = false" type="text">
            <el-icon><icon-arrow-left /></el-icon>
            返回图片库
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
import { ref, onMounted, onBeforeUnmount, computed, watch } from "vue";
import { useRouter } from "vue-router";
import {
  ElUpload,
  ElButton,
  ElIcon,
  ElMessage,
  ElEmpty,
  ElDialog,
  ElMessageBox,
  ElSlider,
} from "element-plus";
import {
  Upload as IconUpload,
  Setting as IconSetting,
  Delete as IconDelete,
  CopyDocument as IconCopy,
  Download as IconDownload,
  ArrowLeft as IconArrowLeft,
  ArrowRight as IconArrowRight,
  Picture as IconPicture,
} from "@element-plus/icons-vue";
import { putImage, getAllImages, deleteImage } from "@/utils/idb.js";

const router = useRouter();
const images = ref([]);
const viewerVisible = ref(false);
const current = ref(null);
const showUploadDialog = ref(false);
const showSettings = ref(false);
const showSettingsPage = ref(false);
const showBackgroundSettings = ref(false);

// 右键菜单相关
const contextMenuVisible = ref(false);
const contextMenuX = ref(0);
const contextMenuY = ref(0);
const contextMenuImage = ref(null);

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
    // 明确移除背景设置
    localStorage.removeItem("backgroundImage");
    localStorage.removeItem("backgroundOpacity");
    // 重置本地状态
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
  images.value = data.map((r) => ({
    ...r,
    objectUrl: r.blob ? URL.createObjectURL(r.blob) : r.url,
  }));
}

onMounted(() => {
  load();
  loadBackgroundSettings(); // 加载背景设置
  // 添加全局点击事件监听，点击其他地方隐藏右键菜单
  document.addEventListener("click", hideContextMenu);
});

// 监听透明度变化，自动保存
watch(backgroundOpacity, () => {
  if (backgroundImage.value) {
    saveBackgroundSettings();
    // 触发自定义事件，通知全局背景组件更新
    window.dispatchEvent(new CustomEvent("backgroundSettingsChanged"));
  }
});

onBeforeUnmount(() => {
  revokeObjectUrls(images.value);
  document.removeEventListener("click", hideContextMenu);
});

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
      blob, // store binary separately-friendly; still OK in IDB
    };
    await putImage(record);
    await load();
    ElMessage.success("已添加到本地库");
    showUploadDialog.value = false;
  } catch (e) {
    ElMessage.error("添加失败");
  }
}

async function remove(id) {
  await deleteImage(id);
  await load();
}

function openViewer(img) {
  current.value = img;
  viewerVisible.value = true;
}

function goToDetail(img) {
  router.push(`/image/${img.id}`);
}

// 右键菜单相关函数
function showContextMenu(event, img) {
  event.preventDefault();
  contextMenuImage.value = img;
  contextMenuX.value = event.clientX;
  contextMenuY.value = event.clientY;
  contextMenuVisible.value = true;
}

function hideContextMenu() {
  contextMenuVisible.value = false;
  contextMenuImage.value = null;
}

async function copyImageToClipboard(img) {
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
      ElMessage.error("无法获取图片数据");
      return;
    }

    // 创建一个临时的隐藏图片元素用于复制
    const tempImg = document.createElement("img");
    tempImg.style.position = "absolute";
    tempImg.style.left = "-9999px";
    tempImg.style.top = "-9999px";
    tempImg.style.width = "1px";
    tempImg.style.height = "1px";
    tempImg.src = URL.createObjectURL(imageBlob);

    document.body.appendChild(tempImg);

    // 等待图片加载完成
    await new Promise((resolve, reject) => {
      tempImg.onload = resolve;
      tempImg.onerror = reject;
      // 设置超时
      setTimeout(() => reject(new Error("图片加载超时")), 5000);
    });

    try {
      // 方法1：尝试使用现代剪贴板API
      if (navigator.clipboard && window.ClipboardItem) {
        try {
          const clipboardItem = new ClipboardItem({
            [imageBlob.type]: imageBlob,
          });
          await navigator.clipboard.write([clipboardItem]);

          // 验证是否真的复制成功
          try {
            const clipboardItems = await navigator.clipboard.read();
            if (clipboardItems.length > 0) {
              ElMessage.success("图片已复制到剪贴板");
              hideContextMenu();
              return;
            } else {
              throw new Error("剪贴板验证失败");
            }
          } catch (verifyError) {
            console.warn("剪贴板验证失败:", verifyError);
            // 继续尝试其他方法
          }
        } catch (clipboardError) {
          console.warn("现代剪贴板API失败:", clipboardError);
          // 继续尝试其他方法
        }
      }

      // 方法2：尝试使用Canvas + 现代剪贴板API
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = tempImg.naturalWidth;
      canvas.height = tempImg.naturalHeight;
      ctx.drawImage(tempImg, 0, 0);

      try {
        canvas.toBlob(async (blob) => {
          if (navigator.clipboard && navigator.clipboard.write) {
            try {
              await navigator.clipboard.write([
                new ClipboardItem({ [blob.type]: blob }),
              ]);

              // 验证是否真的复制成功
              try {
                const clipboardItems = await navigator.clipboard.read();
                if (clipboardItems.length > 0) {
                  ElMessage.success("图片已复制到剪贴板");
                  hideContextMenu();
                  return;
                } else {
                  throw new Error("Canvas剪贴板验证失败");
                }
              } catch (verifyError) {
                console.warn("Canvas剪贴板验证失败:", verifyError);
                // 继续尝试其他方法
              }
            } catch (error) {
              console.warn("Canvas剪贴板API失败:", error);
              // 继续尝试其他方法
            }
          }

          // 方法3：尝试使用execCommand（兼容性最好）
          try {
            // 将canvas添加到DOM中
            canvas.style.position = "absolute";
            canvas.style.left = "-9999px";
            canvas.style.top = "-9999px";
            document.body.appendChild(canvas);

            // 尝试使用execCommand复制
            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(canvas);
            selection.removeAllRanges();
            selection.addRange(range);

            const success = document.execCommand("copy");
            if (success) {
              // 对于execCommand，我们无法直接验证，但可以提示用户测试
              ElMessage.success("图片已复制到剪贴板，请在目标应用中粘贴测试");
            } else {
              // 如果execCommand也失败了，提供下载选项
              ElMessage({
                message: "复制失败，是否要下载图片？",
                type: "warning",
                duration: 5000,
                showClose: true,
                onClose: () => {
                  // 询问用户是否要下载
                  ElMessageBox.confirm(
                    "复制失败，是否要下载图片？",
                    "操作提示",
                    {
                      confirmButtonText: "下载",
                      cancelButtonText: "取消",
                      type: "info",
                    }
                  )
                    .then(() => {
                      downloadImage(img);
                    })
                    .catch(() => {
                      // 用户取消
                    });
                },
              });
            }

            // 清理
            document.body.removeChild(canvas);
            selection.removeAllRanges();
            hideContextMenu();
          } catch (execError) {
            console.warn("execCommand失败:", execError);
            // 如果execCommand也失败了，提供下载选项
            ElMessage({
              message: "复制失败，是否要下载图片？",
              type: "warning",
              duration: 5000,
              showClose: true,
              onClose: () => {
                // 询问用户是否要下载
                ElMessageBox.confirm("复制失败，是否要下载图片？", "操作提示", {
                  confirmButtonText: "下载",
                  cancelButtonText: "取消",
                  type: "info",
                })
                  .then(() => {
                    downloadImage(img);
                  })
                  .catch(() => {
                    // 用户取消
                  });
              },
            });
            hideContextMenu();
          }
        }, imageBlob.type);
      } catch (canvasError) {
        console.warn("Canvas处理失败:", canvasError);
        ElMessage.info("复制失败，请使用下载功能");
        hideContextMenu();
      }
    } finally {
      // 清理临时元素
      document.body.removeChild(tempImg);
      URL.revokeObjectURL(tempImg.src);
    }
  } catch (error) {
    console.error("复制失败:", error);
    ElMessage.info("复制失败，请使用下载功能");
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
      ElMessage.error("无法获取图片数据");
      return;
    }

    // 创建下载链接
    const url = URL.createObjectURL(imageBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = img.name || "image";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    ElMessage.success("图片已下载到本地");
    hideContextMenu();
  } catch (error) {
    console.error("下载失败:", error);
    ElMessage.error("下载失败，请重试");
    hideContextMenu();
  }
}

async function deleteImageFromContext(img) {
  if (!img) return;

  try {
    await deleteImage(img.id);
    ElMessage.success("删除成功");
    await load();
    hideContextMenu();
  } catch (error) {
    ElMessage.error("删除失败");
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
    saveBackgroundSettings(); // 保存背景设置

    // 触发自定义事件，通知全局背景组件更新
    window.dispatchEvent(new CustomEvent("backgroundSettingsChanged"));

    ElMessage.success("背景图片已设置");
  } catch (e) {
    ElMessage.error("背景图片设置失败");
  }
}

function removeBackground() {
  if (backgroundImage.value) {
    URL.revokeObjectURL(backgroundImage.value);
    backgroundImage.value = null;

    // 先保存设置（这会清理 localStorage）
    saveBackgroundSettings();

    // 触发自定义事件，通知全局背景组件更新
    window.dispatchEvent(new CustomEvent("backgroundSettingsChanged"));

    ElMessage.success("背景图片已移除");
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

.sidebar-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.sidebar-item.disabled:hover {
  background: transparent;
}

.main-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  min-height: 0;
  position: relative;
  z-index: 2;
}

.gallery-page {
  width: 100%;
}
.grid {
  column-count: 3;
  column-gap: 12px;
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
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 120px;
  padding: 4px 0;
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  color: #333;
}

.context-menu-item:hover {
  background-color: #f5f5f5;
}

.context-menu-item .el-icon {
  font-size: 16px;
  color: #666;
}

.context-menu-divider {
  height: 1px;
  background-color: #e0e0e0;
  margin: 4px 0;
}

/* 设置页面样式 */
.settings-page {
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
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
