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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { ElButton, ElIcon, ElPopover, ElUpload, ElSlider } from "element-plus";
import { Picture as IconPicture, Upload as IconUpload, Download as IconDownload, Refresh as IconRefresh, CopyDocument as IconCopyDocument } from "@element-plus/icons-vue";
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

async function doExport() {
  if (!backgroundSrc.value || !overlaySrc.value) return;
  exporting.value = true;
  try {
    const [bg, ov] = await Promise.all([
      new Promise((resolve, reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = backgroundSrc.value; }),
      new Promise((resolve, reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = overlaySrc.value; }),
    ]);

    const c = document.createElement("canvas");
    c.width = bg.naturalWidth;
    c.height = bg.naturalHeight;
    const ctx = c.getContext("2d");
    ctx.drawImage(bg, 0, 0);

    const el = canvasRef.value;
    if (!el) throw new Error("no editor");
    const r = el.getBoundingClientRect();
    const bgA = bg.naturalWidth / bg.naturalHeight;
    const elA = r.width / r.height;
    let dW, dH;
    if (bgA > elA) { dW = r.width; dH = r.width / bgA; }
    else { dH = r.height; dW = r.height * bgA; }
    const ratio = bg.naturalWidth / dW;

    ctx.globalAlpha = overlayOpacity.value;
    ctx.drawImage(ov, overlayX.value * ratio, overlayY.value * ratio, ov.naturalWidth * overlayScale.value * ratio, ov.naturalHeight * overlayScale.value * ratio);
    ctx.globalAlpha = 1;

    const url = c.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "composite.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (err) { console.error("Export failed:", err); }
  finally { exporting.value = false; }
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
</style>