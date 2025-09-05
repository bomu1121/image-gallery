<template>
  <div class="gallery-page">
    <div v-if="!images.length" class="empty">
      <!-- <el-empty description="暂无图片，请先上传" /> -->
    </div>

    <div class="grid" v-else>
      <div
        v-for="img in images"
        :key="img.id"
        class="card"
        :class="{ 'is-deleting': isDeleting(img.id) }"
      >
        <img
          :src="img.objectUrl || img.url"
          :alt="img.name"
          @click="onCardClick(img)"
          @contextmenu.prevent="onCardContextMenu($event, img)"
        />
        <div v-if="isDeleting(img.id)" class="deleting-overlay">
          <div class="spinner" />
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
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch } from "vue";
import { useRouter } from "vue-router";
import {
  ElButton,
  ElIcon,
  ElMessage,
  ElEmpty,
  ElDialog,
  ElMessageBox,
} from "element-plus";
import {
  Delete as IconDelete,
  CopyDocument as IconCopy,
  Download as IconDownload,
  Folder as IconFolder,
} from "@element-plus/icons-vue";
import { getAllImages, deleteImage } from "@/utils/idb.js";

const router = useRouter();
const images = ref([]);
const viewerVisible = ref(false);
const current = ref(null);
const deletingIds = ref([]);
const MIN_DELETE_MS = 800; // 调试用最小展示时长

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
  // 让出一次渲染时机，优先绘制侧边栏选中态，再开始加载
  setTimeout(() => {
    load();
  }, 0);
  // 添加全局点击事件监听，点击其他地方隐藏右键菜单
  document.addEventListener("click", hideContextMenu);
  // 监听上传完成事件，刷新列表
  window.addEventListener("imageAdded", load);
});

onBeforeUnmount(() => {
  revokeObjectUrls(images.value);
  document.removeEventListener("click", hideContextMenu);
  window.removeEventListener("imageAdded", load);
});

async function remove(id) {
  if (isDeleting(id)) return;
  startDeleting(id);
  try {
    console.time(`delete-image-${id}`);
    await withMinDuration(deleteImage(id), MIN_DELETE_MS);
    console.timeEnd(`delete-image-${id}`);
    await load();
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
  goToDetail(img);
}

// 右键菜单相关函数
function showContextMenu(event, img) {
  event.preventDefault();
  contextMenuImage.value = img;
  contextMenuX.value = event.clientX;
  contextMenuY.value = event.clientY;
  contextMenuVisible.value = true;
}

function onCardContextMenu(event, img) {
  if (isDeleting(img.id)) return;
  showContextMenu(event, img);
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
    if (isDeleting(img.id)) return;
    // 关闭菜单后展示删除中的遮罩
    hideContextMenu();
    startDeleting(img.id);
    console.time(`delete-image-${img.id}`);
    await withMinDuration(deleteImage(img.id), MIN_DELETE_MS);
    console.timeEnd(`delete-image-${img.id}`);
    ElMessage.success("删除成功");
    await load();
  } catch (error) {
    ElMessage.error("删除失败");
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
</script>

<style scoped>
.gallery-page {
  width: 100%;
  padding: 16px;
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
</style>
