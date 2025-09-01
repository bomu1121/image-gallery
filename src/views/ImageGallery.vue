<template>
  <div class="app-layout">
    <!-- 左侧工具栏 -->
    <div class="sidebar">
      <div
        class="sidebar-item"
        @click="showUploadDialog = true"
        title="上传图片"
      >
        <el-icon><icon-upload /></el-icon>
      </div>
      <div class="sidebar-item" @click="showSettings = true" title="设置">
        <el-icon><icon-setting /></el-icon>
      </div>
    </div>

    <!-- 主内容区域 -->
    <div class="main-content">
      <div v-if="!images.length" class="empty">
        <!-- <el-empty description="暂无图片，请先上传" /> -->
      </div>

      <div class="grid" v-else>
        <div v-for="img in images" :key="img.id" class="card">
          <img
            :src="img.objectUrl || img.url"
            :alt="img.name"
            @click="goToDetail(img)"
          />
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
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import {
  ElUpload,
  ElButton,
  ElIcon,
  ElMessage,
  ElEmpty,
  ElDialog,
} from "element-plus";
import {
  Upload as IconUpload,
  Setting as IconSetting,
} from "@element-plus/icons-vue";
import { putImage, getAllImages, deleteImage } from "@/utils/idb.js";

const router = useRouter();
const images = ref([]);
const viewerVisible = ref(false);
const current = ref(null);
const showUploadDialog = ref(false);
const showSettings = ref(false);

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

onMounted(load);
onBeforeUnmount(() => revokeObjectUrls(images.value));

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
</script>

<style scoped>
.app-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
  margin: 0;
  padding: 0;
}

.sidebar {
  width: 60px;
  background: #f5f5f5;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 0;
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
</style>
