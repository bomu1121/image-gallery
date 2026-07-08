function doDownloadPreview() {
  if (!exportPreviewUrl.value) return;
  const url = exportPreviewUrl.value;

  // Convert data URL to raw bytes
  const parts = url.split(",");
  const mime = (parts[0].match(/:(.*?);/) || [,"image/png"])[1];
  const raw = atob(parts[1]);
  const len = raw.length;
  const arr = new Uint8Array(len);
  for (let i = 0; i < len; i++) arr[i] = raw.charCodeAt(i);

  // Try Tauri native save dialog + fs write
  if (window.__TAURI__) {
    import("@tauri-apps/plugin-dialog").then(async (dialog) => {
      try {
        const filePath = await dialog.save({
          defaultPath: "composite.png",
          filters: [{ name: "PNG Image", extensions: ["png"] }],
        });
        if (!filePath) return; // user cancelled
        const { writeFile } = await import("@tauri-apps/plugin-fs");
        await writeFile(filePath, arr);
        console.log("[overlay:export] Saved via Tauri dialog to:", filePath);
      } catch (e) {
        console.error("[overlay:export] Tauri save failed:", e);
      }
    }).catch(() => {});
    return;
  }

  // Browser fallback: blob URL download
  try {
    const blob = new Blob([arr], { type: mime });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = "composite.png";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    }, 200);
  } catch (e) {
    console.error("[overlay:export] Browser download failed:", e);
  }
}
<template>
  <div class="overlay-page">
    <div class="toolbar">
      <div class="toolbar-left">
        <div class="image-selector" :class="{ filled: backgroundSrc }">
          <el-popover placement="bottom" :width="320" trigger="click" v-model:visible="showBgPicker">
            <template #reference>
              <el-button size="small">
                <el-icon><icon-picture /></el-icon>
                <span>{{ backgroundSrc ? '换背景' : '选择背景图' }}</span>
              </el-button>
            </template>
            <div class="picker-body">
              <el-upload :auto-upload="false" :show-file-list="false" accept="image/*" :on-change="onBgUpload" style="margin-bottom: 8px;">
                <el-button size="small" type="primary" plain>
                  <el-icon><icon-upload /></el-icon> 上传背景图
                </el-button>
              </el-upload>
              <div class="gallery-grid" v-if="galleryImages.length > 0">
                <div class="gallery-label">从图库选择</div>
                <div class="gallery-list">
                  <img v-for="img in galleryImages" :key="img.id" :src="img.objectUrl || img.url" class="gallery-thumb" @click="pickBackground(img)" />
                </div>
              </div>
              <div v-else class="gallery-empty">图库中暂无图片</div>
            </div>
          </el-popover>
        </div>

        <div class="image-selector" :class="{ filled: overlaySrc }">
          <el-popover placement="bottom" :width="320" trigger="click" v-model:visible="showOverlayPicker">
            <template #reference>
              <el-button size="small" :disabled="!backgroundSrc">
                <el-icon><icon-copy-document /></el-icon>
                <span>{{ overlaySrc ? '换叠加图' : '选择叠加图' }}</span>
              </el-button>
            </template>
            <div class="picker-body">
              <el-upload :auto-upload="false" :show-file-list="false" accept="image/*" :on-change="onOverlayUpload" style="margin-bottom: 8px;">
                <el-button size="small" type="primary" plain>
                  <el-icon><icon-upload /></el-icon> 上传叠加图
                </el-button>
              </el-upload>
              <div class="gallery-grid" v-if="galleryImages.length > 0">
                <div class="gallery-label">从图库选择</div>
                <div class="gallery-list">
                  <img v-for="img in galleryImages" :key="img.id" :src="img.objectUrl || img.url" class="gallery-thumb" @click="pickOverlay(img)" />
                </div>
              </div>
              <div v-else class="gallery-empty">图库中暂无图片</div>
            </div>
          </el-popover>
        </div>
      </div>

      <div class="toolbar-center" v-if="overlaySrc">
        <div class="control-group">
          <span class="control-label">不透明度</span>
          <el-slider v-model="overlayOpacity" :min="0.1" :max="1" :step="0.05" style="width: 80px;" :show-tooltip="false" />
          <span class="control-value">{{ Math.round(overlayOpacity * 100) }}%</span>
        </div>
        <div class="control-group">
          <span class="control-label">缩放</span>
          <el-slider v-model="overlayScale" :min="0.05" :max="3" :step="0.01" style="width: 80px;" :show-tooltip="false" />
          <input class="scale-input" type="number" :value="Math.round(overlayScale * 100)" @change="onScaleInput" min="5" max="300" step="1" />
          <span class="control-value">%</span>
        </div>
        <el-button size="small" @click="resetOverlay" plain>
          <el-icon><icon-refresh /></el-icon> 重置
        </el-button>
      </div>

      <div class="toolbar-right">
        <el-button type="primary" size="small" :disabled="!backgroundSrc || !overlaySrc" @click="doExport" :loading="exporting">
          <el-icon><icon-download /></el-icon> 导出
        </el-button>
      </div>
    </div>

    <div class="editor-area">
      <div v-if="!backgroundSrc" class="editor-placeholder">
        <el-icon :size="48"><icon-picture /></el-icon>
        <p>请先选择一张背景图</p>
      </div>
      <div v-else class="editor-canvas" ref="canvasRef">
        <img :src="backgroundSrc" class="bg-image" ref="bgImgRef" draggable="false" />
        <img v-if="overlaySrc" :src="overlaySrc" class="overlay-image" :style="overlayStyle" draggable="false" @mousedown="onOverlayMouseDown" @touchstart.prevent="onOverlayTouchStart" />
      </div>
    </div>

    <!-- Export Preview Modal -->
    <div v-if="exportPreviewUrl" class="export-preview-overlay" @click.self="exportPreviewUrl = null">
      <div class="export-preview-card">
        <div class="export-preview-header">
          <span>导出预览</span>
          <el-button size="small" circle @click="exportPreviewUrl = null">
            <el-icon><icon-close /></el-icon>
          </el-button>
        </div>
        <div class="export-preview-body">
          <img :src="exportPreviewUrl" alt="导出预览" />
        </div>
        <div class="export-preview-actions">
          <el-button size="small" @click="doDownloadPreview">下载图片</el-button>
          <el-button size="small" plain @click="exportPreviewUrl = null">关闭</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { ElButton, ElIcon, ElPopover, ElUpload, ElSlider } from "element-plus";
import { Picture as IconPicture, Upload as IconUpload, Download as IconDownload, Refresh as IconRefresh, CopyDocument as IconCopyDocument, Close as IconClose } from "@element-plus/icons-vue";
import { getAllImages } from "@/utils/idb.js";

const galleryImages = ref([]);
async function loadGallery() {
  try {
    const data = await getAllImages();
    galleryImages.value = data.filter(r => r.parentImageId === null || r.parentImageId === undefined).map(r => ({ ...r, objectUrl: r.blob instanceof Blob ? URL.createObjectURL(r.blob) : r.url }));
  } catch (e) { console.error("Failed to load gallery:", e); }
}

const backgroundSrc = ref(null);
const overlaySrc = ref(null);
const bgImgRef = ref(null);
const showBgPicker = ref(false);
const showOverlayPicker = ref(false);

function fileToUrl(file) {
  const raw = file.raw;
  if (!raw) return null;
  return raw instanceof Blob ? URL.createObjectURL(raw) : null;
}

function onBgUpload(file) {
  const url = fileToUrl(file);
  if (url) {
    if (backgroundSrc.value) URL.revokeObjectURL(backgroundSrc.value);
    backgroundSrc.value = url;
    overlayX.value = 0; overlayY.value = 0; overlayScale.value = 1; overlayOpacity.value = 1;
    showBgPicker.value = false;
  }
}

function onOverlayUpload(file) {
  const url = fileToUrl(file);
  if (url) {
    if (overlaySrc.value) URL.revokeObjectURL(overlaySrc.value);
    overlaySrc.value = url;
    overlayX.value = 0; overlayY.value = 0; overlayScale.value = 1; overlayOpacity.value = 1;
    showOverlayPicker.value = false;
  }
}

function pickBackground(img) {
  backgroundSrc.value = img.objectUrl || img.url;
  overlayX.value = 0; overlayY.value = 0; overlayScale.value = 1; overlayOpacity.value = 1;
  showBgPicker.value = false;
}

function pickOverlay(img) {
  overlaySrc.value = img.objectUrl || img.url;
  overlayX.value = 0; overlayY.value = 0; overlayScale.value = 1; overlayOpacity.value = 1;
  showOverlayPicker.value = false;
}

const overlayX = ref(0);
const overlayY = ref(0);
const overlayScale = ref(1);
const overlayOpacity = ref(1);

function resetOverlay() { overlayX.value = 0; overlayY.value = 0; overlayScale.value = 1; overlayOpacity.value = 1; }
function onScaleInput(e) { const v = parseInt(e.target.value, 10); if (!isNaN(v) && v >= 5 && v <= 300) overlayScale.value = v / 100; }

const overlayStyle = computed(() => ({
  transform: `translate(${overlayX.value}px, ${overlayY.value}px) scale(${overlayScale.value})`,
  opacity: overlayOpacity.value,
  transformOrigin: "top left",
}));

const canvasRef = ref(null);
let dragging = false, dragStartX = 0, dragStartY = 0, dragOrigX = 0, dragOrigY = 0;

function clamp() {
  overlayX.value = Math.max(-3000, Math.min(3000, overlayX.value));
  overlayY.value = Math.max(-3000, Math.min(3000, overlayY.value));
}

function onOverlayMouseDown(e) {
  e.preventDefault(); dragging = true;
  dragStartX = e.clientX; dragStartY = e.clientY;
  dragOrigX = overlayX.value; dragOrigY = overlayY.value;
  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
}

function onMouseMove(e) { if (!dragging) return; overlayX.value = dragOrigX + (e.clientX - dragStartX); overlayY.value = dragOrigY + (e.clientY - dragStartY); }
function onMouseUp() { dragging = false; clamp(); document.removeEventListener("mousemove", onMouseMove); document.removeEventListener("mouseup", onMouseUp); }

function onOverlayTouchStart(e) {
  if (e.touches.length !== 1) return; dragging = true;
  dragStartX = e.touches[0].clientX; dragStartY = e.touches[0].clientY;
  dragOrigX = overlayX.value; dragOrigY = overlayY.value;
  document.addEventListener("touchmove", onTouchMove, { passive: false });
  document.addEventListener("touchend", onTouchEnd);
}

function onTouchMove(e) { if (!dragging) return; e.preventDefault(); overlayX.value = dragOrigX + (e.touches[0].clientX - dragStartX); overlayY.value = dragOrigY + (e.touches[0].clientY - dragStartY); }
function onTouchEnd() { dragging = false; clamp(); document.removeEventListener("touchmove", onTouchMove); document.removeEventListener("touchend", onTouchEnd); }

const exporting = ref(false);
const exportPreviewUrl = ref(null);

async function doExport() {
  console.log("[overlay:export] START");
  if (!backgroundSrc.value || !overlaySrc.value) {
    console.log("[overlay:export] Missing source images, aborting");
    return;
  }
  exporting.value = true;
  try {
    console.log("[overlay:export] Loading images...");
    const bg = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => { console.log("[overlay:export] Background loaded:", img.naturalWidth, "x", img.naturalHeight); resolve(img); };
      img.onerror = (e) => { console.error("[overlay:export] Background failed to load"); reject(e); };
      img.src = backgroundSrc.value;
    });
    const ov = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => { console.log("[overlay:export] Overlay loaded:", img.naturalWidth, "x", img.naturalHeight); resolve(img); };
      img.onerror = (e) => { console.error("[overlay:export] Overlay failed to load"); reject(e); };
      img.src = overlaySrc.value;
    });

    console.log("[overlay:export] Creating canvas...");
    const c = document.createElement("canvas");
    c.width = bg.naturalWidth;
    c.height = bg.naturalHeight;
    const ctx = c.getContext("2d");
    ctx.drawImage(bg, 0, 0);

    const el = canvasRef.value;
    if (!el) { console.error("[overlay:export] No editor ref!"); throw new Error("no editor"); }
    const r = el.getBoundingClientRect();
    console.log("[overlay:export] Editor:", r.width, "x", r.height);

    const bgA = bg.naturalWidth / bg.naturalHeight;
    const elA = r.width / r.height;
    let dW, dH;
    if (bgA > elA) { dW = r.width; dH = r.width / bgA; }
    else { dH = r.height; dW = r.height * bgA; }
    const ratio = bg.naturalWidth / dW;
    console.log("[overlay:export] Display:", dW, "x", dH, "ratio:", ratio);

    ctx.globalAlpha = overlayOpacity.value;
    const ox = overlayX.value * ratio;
    const oy = overlayY.value * ratio;
    const ow = ov.naturalWidth * overlayScale.value * ratio;
    const oh = ov.naturalHeight * overlayScale.value * ratio;
    console.log("[overlay:export] Drawing overlay at", ox, oy, ow, "x", oh);
    ctx.drawImage(ov, ox, oy, ow, oh);
    ctx.globalAlpha = 1;

    console.log("[overlay:export] Generating data URL...");
    const url = c.toDataURL("image/png");
    console.log("[overlay:export] Data URL length:", url.length);

    // Set preview URL to show the result
    exportPreviewUrl.value = url;
    console.log("[overlay:export] Preview URL set");

    // Also try browser download (works in regular browsers, may be blocked in webview)
    const a = document.createElement("a");
    a.href = url;
    a.download = "composite.png";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); }, 200);
  } catch (err) {
    console.error("[overlay:export] FAILED:", err);
  } finally {
    exporting.value = false;
    console.log("[overlay:export] END");
  }
}

onMounted(async () => { await loadGallery(); });
onBeforeUnmount(() => {
  document.removeEventListener("mousemove", onMouseMove);
  document.removeEventListener("mouseup", onMouseUp);
  document.removeEventListener("touchmove", onTouchMove);
  document.removeEventListener("touchend", onTouchEnd);
});
</script>

<style scoped>
.overlay-page { width: 100%; height: 100%; display: flex; flex-direction: column; background: #1a1a2e; }
.toolbar { display: flex; align-items: center; justify-content: space-between; padding: 8px 16px; background: rgba(30,30,50,0.95); border-bottom: 1px solid rgba(255,255,255,0.08); gap: 16px; flex-shrink: 0; }
.toolbar-left { display: flex; gap: 8px; }
.toolbar-center { display: flex; align-items: center; gap: 14px; }
.toolbar-right { display: flex; gap: 8px; }
.control-group { display: flex; align-items: center; gap: 4px; }
.control-label { font-size: 12px; color: #aab; white-space: nowrap; }
.control-value { font-size: 11px; color: #889; min-width: 30px; }
.scale-input { width: 48px; height: 24px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); border-radius: 4px; color: #ccd; font-size: 12px; text-align: center; outline: none; }
.scale-input:focus { border-color: #409eff; background: rgba(255,255,255,0.12); }
.scale-input::-webkit-inner-spin-button, .scale-input::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
.picker-body { max-height: 300px; overflow-y: auto; }
.gallery-label { font-size: 12px; color: #999; margin-bottom: 6px; }
.gallery-list { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
.gallery-thumb { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 4px; cursor: pointer; border: 2px solid transparent; transition: border-color 0.15s; }
.gallery-thumb:hover { border-color: #409eff; }
.gallery-empty { font-size: 12px; color: #999; text-align: center; padding: 16px; }
.editor-area { flex: 1; min-height: 0; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; }
.editor-placeholder { display: flex; flex-direction: column; align-items: center; gap: 12px; color: #556; }
.editor-placeholder p { font-size: 14px; color: #667; }
.editor-canvas { position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
.bg-image { max-width: 100%; max-height: 100%; object-fit: contain; user-select: none; pointer-events: none; background-image: linear-gradient(45deg, #2a2a3a 25%, transparent 25%), linear-gradient(-45deg, #2a2a3a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #2a2a3a 75%), linear-gradient(-45deg, transparent 75%, #2a2a3a 75%); background-size: 16px 16px; background-position: 0 0, 0 8px, 8px -8px, -8px 0; }
.overlay-image { position: absolute; cursor: grab; user-select: none; max-width: none; transition: opacity 0.15s; }
.overlay-image:active { cursor: grabbing; }
.toolbar :deep(.el-button) { font-size: 12px; }
.toolbar :deep(.el-button--small) { padding: 5px 10px; }
.export-preview-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.75);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}
.export-preview-card {
  background: #1e1e32;
  border-radius: 8px;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.export-preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  color: #ccd;
  font-size: 14px;
  font-weight: 500;
}
.export-preview-body {
  flex: 1;
  overflow: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
.export-preview-body img {
  max-width: 100%;
  max-height: 65vh;
  object-fit: contain;
  border-radius: 4px;
}
.export-preview-actions {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid rgba(255,255,255,0.08);
  justify-content: flex-end;
}
</style>