<template>
  <div class="detail-wrapper">
    <!-- 固定顶部栏（只覆盖主内容区域，避开60px侧边栏） -->
    <div class="fixed-header" ref="headerRef">
      <div class="header-content">
        <div @click="goBack" class="back-icon-button">
          <el-icon><ArrowLeft /></el-icon>
        </div>
        <div
          @click="removeImage"
          :class="{ disabled: !image }"
          class="delete-icon-button"
        >
          <el-icon><Delete /></el-icon>
        </div>
      </div>
    </div>

    <!-- 内容滚动区域，避免被固定栏遮挡 -->
    <div class="content-wrapper">
      <div v-if="!image" class="empty">
        <el-empty description="图片不存在" />
      </div>

      <div v-else class="content">
        <!-- 左侧图片区域 -->
        <div class="image-section">
          <div
            class="image-viewport"
            :style="{ height: imageAreaHeight + 'px' }"
          >
            <div class="image-container">
              <img
                :src="image.objectUrl || image.url"
                :alt="image.name"
                @click="openViewer"
              />
            </div>
          </div>
          <!-- 组图轮播条（仅当存在组图时显示） -->
          <ThumbnailCarousel
            v-if="childrenCount > 0"
            :items="allGroupImages"
            :current-index="currentImageIndex"
            :get-item-image="getThumbnailUrl"
            :get-item-alt="(img) => img.name"
            @item-click="switchToImage"
            class="group-carousel"
          />
        </div>

        <!-- 右侧信息区域 -->
        <div class="info-section">
          <!-- 基本信息 -->
          <div class="info-section-item">
            <h3 class="section-title">基本信息</h3>
            <div class="info-grid">
              <div class="info-row">
                <span class="info-label">文件名</span>
                <span class="info-value">{{ image.name }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">文件类型</span>
                <span class="info-value">{{ image.type || "未知" }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">文件大小</span>
                <span class="info-value">{{ formatFileSize(image.size) }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">上传时间</span>
                <span class="info-value">{{
                  formatDate(image.createdAt)
                }}</span>
              </div>
            </div>
          </div>

          <!-- 备注区域 -->
          <div class="info-section-item">
            <h3 class="section-title">备注</h3>
            <div class="notes-container">
              <!-- 显示模式 -->
              <div
                v-if="!isEditingNotes"
                class="notes-display"
                @click="startEditNotes"
              >
                <div v-if="image.notes" class="notes-content">
                  {{ image.notes }}
                </div>
                <div v-else class="notes-placeholder">
                  <span class="placeholder-text">点击添加图片备注...</span>
                  <el-icon class="edit-icon"><Edit /></el-icon>
                </div>
              </div>

              <!-- 编辑模式 -->
              <div v-else class="notes-edit">
                <el-input
                  v-model="editingNotes"
                  type="textarea"
                  :rows="6"
                  placeholder="添加图片备注..."
                  @blur="saveNotes"
                  @keydown.escape="cancelEditNotes"
                  ref="notesInput"
                  class="notes-input"
                />
              </div>
            </div>
          </div>

          <!-- 标签区域 -->
          <div class="info-section-item">
            <div class="section-header">
              <h3 class="section-title">标签</h3>
              <div class="tag-actions">
                <!-- AI分析按钮和模式选择面板 -->
                <div class="ai-analyze-container">
                  <el-tooltip
                    :content="hasValidApiKey ? '' : '请先进行模型配置'"
                    :disabled="hasValidApiKey"
                    placement="top"
                  >
                    <el-button
                      size="small"
                      type="primary"
                      :loading="isAnalyzing"
                      :disabled="!hasValidApiKey"
                      @click="analyzeImageWithAI"
                      @mouseenter="
                        hasValidApiKey ? showAnalysisModePanelNow() : null
                      "
                      @mouseleave="
                        hasValidApiKey ? hideAnalysisModePanel() : null
                      "
                      class="ai-analyze-button"
                      :class="{ 'ai-analyze-button-disabled': !hasValidApiKey }"
                    >
                      <el-icon><Star /></el-icon>
                      AI分析
                    </el-button>
                  </el-tooltip>

                  <!-- 分析模式选择面板 -->
                  <div
                    v-show="showAnalysisModePanel && hasValidApiKey"
                    @mouseenter="showAnalysisModePanelNow"
                    @mouseleave="hideAnalysisModePanel"
                    class="analysis-mode-panel"
                  >
                    <!-- 连接桥梁，确保鼠标移动过程中不会中断 -->
                    <div class="hover-bridge"></div>
                    <div class="panel-header">
                      <span class="panel-title">选择分析模式</span>
                    </div>
                    <div class="mode-options">
                      <label
                        class="mode-option"
                        :class="{ active: analysisMode === 'similarity-based' }"
                      >
                        <input
                          type="radio"
                          v-model="analysisMode"
                          value="similarity-based"
                          class="mode-radio"
                        />
                        <div class="mode-content">
                          <div class="mode-title">相似图集分析</div>
                          <div class="mode-description">
                            基于相似图片的标签推荐（推荐）
                          </div>
                        </div>
                      </label>

                      <label
                        class="mode-option"
                        :class="{
                          active: analysisMode === 'ai-direct-recommendation',
                        }"
                      >
                        <input
                          type="radio"
                          v-model="analysisMode"
                          value="ai-direct-recommendation"
                          class="mode-radio"
                        />
                        <div class="mode-content">
                          <div class="mode-title">AI直接推荐</div>
                          <div class="mode-description">
                            AI直接分析图片生成新标签（不依赖标签库）
                          </div>
                        </div>
                      </label>

                      <label
                        class="mode-option"
                        :class="{
                          active: analysisMode === 'visual-similarity',
                        }"
                      >
                        <input
                          type="radio"
                          v-model="analysisMode"
                          value="visual-similarity"
                          class="mode-radio"
                        />
                        <div class="mode-content">
                          <div class="mode-title">视觉相似性分析</div>
                          <div class="mode-description">
                            基于视觉特征识别相似图片
                          </div>
                        </div>
                      </label>

                      <label
                        class="mode-option"
                        :class="{
                          active: analysisMode === 'semantic-analysis',
                        }"
                      >
                        <input
                          type="radio"
                          v-model="analysisMode"
                          value="semantic-analysis"
                          class="mode-radio"
                        />
                        <div class="mode-content">
                          <div class="mode-title">语义分析</div>
                          <div class="mode-description">
                            基于语义特征分析图片内容
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
                <el-button
                  size="small"
                  @click="goToAISettings"
                  class="ai-config-button"
                >
                  <el-icon><Setting /></el-icon>
                  配置
                </el-button>
              </div>
            </div>

            <!-- AI分析结果 -->
            <div v-if="aiAnalysisResult.length > 0" class="ai-analysis-result">
              <div class="ai-result-header">
                <span class="ai-result-title">AI推荐标签</span>
                <div class="ai-result-actions">
                  <el-button
                    size="small"
                    type="text"
                    @click="showAILogs"
                    class="view-logs-button"
                  >
                    <el-icon><Document /></el-icon>
                    查看日志
                  </el-button>
                  <el-button
                    size="small"
                    type="text"
                    @click="clearAIAnalysis"
                    class="clear-ai-button"
                  >
                    清除
                  </el-button>
                </div>
              </div>
              <div class="ai-tags">
                <div
                  v-for="aiTag in aiAnalysisResult"
                  :key="aiTag.tag"
                  class="ai-tag-item"
                  :class="{ 'ai-tag-selected': selectedAITags.has(aiTag.tag) }"
                  @click="toggleAITag(aiTag.tag)"
                >
                  <div class="ai-tag-content">
                    <span class="ai-tag-text">{{ aiTag.tag }}</span>
                    <span class="ai-tag-confidence"
                      >{{ (aiTag.confidence * 100).toFixed(0) }}%</span
                    >
                  </div>
                  <div
                    v-if="
                      aiTag.category &&
                      analysisMode === 'ai-direct-recommendation'
                    "
                    class="ai-tag-category"
                  >
                    {{ aiTag.category }}
                  </div>
                  <el-icon
                    v-if="selectedAITags.has(aiTag.tag)"
                    class="ai-tag-check"
                  >
                    <Check />
                  </el-icon>
                </div>
              </div>
              <div class="ai-actions">
                <el-button
                  size="small"
                  type="primary"
                  :disabled="selectedAITags.size === 0"
                  @click="addSelectedAITags"
                  class="add-ai-tags-button"
                >
                  添加选中标签 ({{ selectedAITags.size }})
                </el-button>
              </div>
            </div>

            <div class="tags-container">
              <div class="tags-display">
                <!-- 现有标签 -->
                <div
                  v-for="tag in image.tags"
                  :key="tag"
                  class="tag-item"
                  @click="removeTag(tag)"
                >
                  {{ tag }}
                  <el-icon class="tag-remove"><Delete /></el-icon>
                </div>

                <!-- 添加标签按钮 -->
                <div
                  v-if="!isAddingTag"
                  class="add-tag-button"
                  @click="startAddingTag"
                >
                  <el-icon><Plus /></el-icon>
                </div>

                <!-- 正在添加的标签输入框 -->
                <div
                  v-if="isAddingTag"
                  class="tag-item adding-tag"
                  :style="{ width: tagInputWidth + 'px' }"
                >
                  <input
                    v-model="newTagInput"
                    ref="tagInput"
                    class="tag-input-field"
                    placeholder="输入标签"
                    @keyup.enter="confirmAddTag"
                    @keyup.escape="cancelAddTag"
                    @blur="confirmAddTag"
                    @input="adjustTagInputWidth"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  ElButton,
  ElEmpty,
  ElDescriptions,
  ElDescriptionsItem,
  ElInput,
  ElIcon,
  ElMessageBox,
  ElTooltip,
} from "element-plus";
import {
  ArrowLeft,
  View,
  Edit,
  Delete,
  Plus,
  Star,
  Setting,
  Check,
  Document,
} from "@/utils/icons.js";
import {
  getImageById,
  deleteImage,
  updateImage,
  getChildrenImages,
} from "@/utils/idb.js";
import { useDrawerNotification } from "@/composables/useDrawerNotification.js";
import { aiImageAnalysisService } from "@/services/AIImageAnalysisService.js";
import ThumbnailCarousel from "@/components/ThumbnailCarousel.vue";

const route = useRoute();
const router = useRouter();
const image = ref(null);
const headerRef = ref(null);
const children = ref([]);
const childrenCount = ref(0);
const allGroupImages = ref([]); // 包含主图和所有附图的数组
const currentImageIndex = ref(0); // 当前显示的图片索引
const carouselRef = ref(null);
const isEditingNotes = ref(false);
const editingNotes = ref("");
const notesInput = ref(null);
const newTagInput = ref("");
const tagInput = ref(null);
const isAddingTag = ref(false);
const tagInputWidth = ref(80); // 默认最小宽度
const { success, error } = useDrawerNotification();

// AI分析相关状态
const isAnalyzing = ref(false);
const aiAnalysisResult = ref([]);
const selectedAITags = ref(new Set());
const showAnalysisModePanel = ref(false);
const analysisMode = ref("ai-direct-recommendation"); // 分析模式：ai-direct-recommendation、similarity-based、visual-similarity 或 semantic-analysis
// 计算图片展示区域高度（视口高度 - 顶部栏高度）
const imageAreaHeight = ref(0);

function computeImageAreaHeight() {
  const headerHeight = headerRef.value ? headerRef.value.offsetHeight : 0;
  // 不再额外扣除 content-wrapper 的内边距
  const verticalPadding = 0;
  const viewport = window.innerHeight || document.documentElement.clientHeight;
  const height = Math.max(viewport - headerHeight - verticalPadding, 200);
  imageAreaHeight.value = height;
}

function onResize() {
  computeImageAreaHeight();
}

onMounted(() => {
  computeImageAreaHeight();
  window.addEventListener("resize", onResize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", onResize);
});

// 面板显示控制方法
let hideTimer = null;

function hideAnalysisModePanel() {
  // 清除之前的定时器
  if (hideTimer) {
    clearTimeout(hideTimer);
  }

  // 设置新的延迟隐藏定时器
  hideTimer = setTimeout(() => {
    showAnalysisModePanel.value = false;
    hideTimer = null;
  }, 300); // 增加延迟时间，给用户更多时间移动到面板上
}

function showAnalysisModePanelNow() {
  // 清除隐藏定时器
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
  showAnalysisModePanel.value = true;
}

// 获取当前选中的AI服务
const getCurrentAIService = () => {
  try {
    const config = localStorage.getItem("ai-service-config");
    if (config) {
      const parsedConfig = JSON.parse(config);
      return parsedConfig.selectedProvider || null;
    }
  } catch (err) {
    console.warn("获取AI服务配置失败:", err);
  }
  return null;
};

// 计算是否有有效的API密钥
const hasValidApiKey = computed(() => {
  const currentService = getCurrentAIService();
  if (currentService) {
    return aiImageAnalysisService.isServiceConfigured(currentService);
  }

  // 如果没有选中服务，检查是否有任何服务可用
  const status = aiImageAnalysisService.getApiStatus();
  return (
    status.openai ||
    status.googleVision ||
    status.azureVision ||
    status.baiduErnie ||
    status.alibabaQwen ||
    status.zhipuAI ||
    status.kimi ||
    status.doubao ||
    status.silicoflow
  );
});

function revokeObjectUrl(img) {
  if (img && img.objectUrl) {
    URL.revokeObjectURL(img.objectUrl);
  }
}

async function loadImage() {
  const imageId = route.params.id;
  if (!imageId) {
    error("图片ID不存在");
    return;
  }

  try {
    let data = await getImageById(parseInt(imageId));
    if (!data) {
      error("图片不存在");
      return;
    }

    // 若是附图，自动切换到其主图详情
    if (data.parentImageId !== null && data.parentImageId !== undefined) {
      const parent = await getImageById(data.parentImageId);
      if (parent) data = parent;
    }

    revokeObjectUrl(image.value);
    image.value = {
      ...data,
      objectUrl:
        data.blob && data.blob instanceof Blob
          ? URL.createObjectURL(data.blob)
          : data.url,
      // 确保tags字段存在
      tags: data.tags || [],
    };

    // 加载所有组图（主图 + 附图）
    try {
      const childList = await getChildrenImages(image.value.id);
      childrenCount.value = childList.length;

      // 释放旧图片的 objectUrl 并将其在 allGroupImages 中置空
      allGroupImages.value.forEach((img) => {
        if (img.objectUrl && img.objectUrl.startsWith("blob:")) {
          URL.revokeObjectURL(img.objectUrl);
          img.objectUrl = null; // 关键：置空 objectUrl
        }
      });

      // 构建包含主图和附图的数组
      const normalizedChildren = childList.map((child) => ({
        ...child,
        objectUrl:
          child.blob && child.blob instanceof Blob
            ? URL.createObjectURL(child.blob)
            : child.url,
      }));

      // 主图放在第一位，然后是附图
      allGroupImages.value = [image.value, ...normalizedChildren];
      currentImageIndex.value = 0; // 默认显示主图

      // 保持children数组用于兼容性
      children.value = normalizedChildren;
    } catch (e) {
      childrenCount.value = 0;
      allGroupImages.value = [image.value]; // 至少包含主图
      currentImageIndex.value = 0;
      children.value = [];
    }
  } catch (err) {
    error("加载图片失败");
  }
}

onMounted(loadImage);
onBeforeUnmount(() => {
  revokeObjectUrl(image.value);
  allGroupImages.value.forEach(
    (img) => img.objectUrl && URL.revokeObjectURL(img.objectUrl)
  );
});

function goBack() {
  router.push("/gallery");
}

async function removeImage() {
  if (!image.value) return;

  try {
    await ElMessageBox.confirm(
      `确定要删除图片 "${image.value.name}" 吗？`,
      "删除确认",
      {
        confirmButtonText: "确定删除",
        cancelButtonText: "取消",
        type: "warning",
        confirmButtonClass: "el-button--danger",
      }
    );

    await deleteImage(image.value.id);
    success("删除成功");
    goBack();
  } catch (err) {
    if (err === "cancel") {
      // 用户取消删除，不显示错误信息
      return;
    }
    error("删除失败");
  }
}

function openViewer() {
  if (!image.value) return;
  const src = image.value.objectUrl || image.value.url;
  if (src) {
    window.open(src, "_blank");
  }
}

// 打开子图
function openChildViewer(child) {
  const src = child.objectUrl || child.url;
  if (src) window.open(src, "_blank");
}

// 获取缩略图的URL
function getThumbnailUrl(img) {
  // 如果有有效的 objectUrl（blob URL），直接使用
  if (img.objectUrl && img.objectUrl.startsWith("blob:")) {
    return img.objectUrl;
  }

  // 如果没有 objectUrl 但有 blob 数据，创建新的 objectUrl
  if (!img.objectUrl && img.blob && img.blob instanceof Blob) {
    const newObjectUrl = URL.createObjectURL(img.blob);
    // 更新 allGroupImages 中的 objectUrl
    const index = allGroupImages.value.findIndex((item) => item.id === img.id);
    if (index !== -1) {
      allGroupImages.value[index].objectUrl = newObjectUrl;
    }
    return newObjectUrl;
  }

  // 最后回退到原始 URL
  return img.url;
}

// 切换到指定索引的图片
function switchToImage(index) {
  if (index < 0 || index >= allGroupImages.value.length) return;

  currentImageIndex.value = index;
  const targetImage = allGroupImages.value[index];

  // 确保目标图片有有效的 objectUrl
  let targetObjectUrl = targetImage.objectUrl;
  if (
    !targetObjectUrl &&
    targetImage.blob &&
    targetImage.blob instanceof Blob
  ) {
    targetObjectUrl = URL.createObjectURL(targetImage.blob);
    // 更新 allGroupImages 中的 objectUrl，避免重复创建
    allGroupImages.value[index].objectUrl = targetObjectUrl;
  } else if (!targetObjectUrl) {
    targetObjectUrl = targetImage.url;
  }

  // 释放当前图片的 objectUrl 并在 allGroupImages 中置空
  if (
    image.value &&
    image.value.objectUrl &&
    image.value.objectUrl.startsWith("blob:")
  ) {
    URL.revokeObjectURL(image.value.objectUrl);
    // 在 allGroupImages 中找到对应的图片并置空其 objectUrl
    const currentIndex = allGroupImages.value.findIndex(
      (img) => img.id === image.value.id
    );
    if (currentIndex !== -1) {
      allGroupImages.value[currentIndex].objectUrl = null;
    }
  }

  // 更新当前显示的图片
  image.value = {
    ...targetImage,
    objectUrl: targetObjectUrl,
    tags: targetImage.tags || [],
  };
}

function formatFileSize(bytes) {
  if (!bytes) return "未知";
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
}

function formatDate(timestamp) {
  if (!timestamp) return "未知";
  return new Date(timestamp).toLocaleString("zh-CN");
}

function startEditNotes() {
  isEditingNotes.value = true;
  editingNotes.value = image.value?.notes || "";
  // 等待DOM更新后聚焦输入框
  setTimeout(() => {
    if (notesInput.value) {
      notesInput.value.focus();
    }
  }, 100);
}

function cancelEditNotes() {
  isEditingNotes.value = false;
  editingNotes.value = "";
}

async function saveNotes() {
  if (!image.value) return;

  try {
    image.value.notes = editingNotes.value;
    await updateImage(image.value.id, { notes: editingNotes.value || "" });
    isEditingNotes.value = false;
    editingNotes.value = "";
  } catch (err) {
    error("备注保存失败");
    // 保存失败时不退出编辑模式，让用户可以重试
  }
}

// 动态调整输入框宽度
function adjustTagInputWidth() {
  if (!tagInput.value) return;

  // 使用Canvas API来精确测量文本宽度
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  // 设置字体样式，与CSS中的样式保持一致
  context.font =
    '500 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

  const text = newTagInput.value || "输入标签";
  const textWidth = context.measureText(text).width;

  // 设置最小宽度80px，最大宽度200px，并加上一些padding
  tagInputWidth.value = Math.min(Math.max(textWidth + 24, 80), 200);
}

// 标签管理函数
function startAddingTag() {
  isAddingTag.value = true;
  newTagInput.value = "";
  tagInputWidth.value = 80; // 重置为默认宽度

  // 等待DOM更新后聚焦输入框
  setTimeout(() => {
    if (tagInput.value) {
      tagInput.value.focus();
    }
  }, 100);
}

function cancelAddTag() {
  isAddingTag.value = false;
  newTagInput.value = "";
}

async function confirmAddTag() {
  if (!newTagInput.value.trim()) {
    cancelAddTag();
    return;
  }

  if (!image.value) {
    cancelAddTag();
    return;
  }

  const tag = newTagInput.value.trim();

  // 检查标签是否已存在
  if (!image.value.tags) {
    image.value.tags = [];
  }

  if (image.value.tags.includes(tag)) {
    error("标签已存在");
    cancelAddTag();
    return;
  }

  try {
    // 先退出添加模式，避免状态混乱
    isAddingTag.value = false;

    // 添加标签到本地状态
    image.value.tags.push(tag);

    // 保存到数据库
    await updateImage(image.value.id, { tags: image.value.tags });

    success(`标签 "${tag}" 添加成功`);

    // 清空输入框
    newTagInput.value = "";
  } catch (err) {
    error("标签添加失败");
    // 恢复本地状态
    image.value.tags.pop();
    // 重新进入添加模式
    isAddingTag.value = true;
  }
}

async function removeTag(tagToRemove) {
  if (!image.value || !image.value.tags) return;

  try {
    // 从本地状态移除标签
    const index = image.value.tags.indexOf(tagToRemove);
    if (index > -1) {
      image.value.tags.splice(index, 1);
    }

    // 保存到数据库
    await updateImage(image.value.id, { tags: image.value.tags });

    success(`标签 "${tagToRemove}" 删除成功`);
  } catch (err) {
    error("标签删除失败");
    // 恢复本地状态
    image.value.tags.push(tagToRemove);
  }
}

// AI分析相关函数
async function analyzeImageWithAI() {
  if (!image.value) {
    error("图片不存在");
    return;
  }

  if (!hasValidApiKey.value) {
    error("请先配置AI服务API密钥");
    goToAISettings();
    return;
  }

  isAnalyzing.value = true;

  try {
    // 获取图片的blob数据
    let imageBlob;
    if (image.value.blob && image.value.blob instanceof Blob) {
      imageBlob = image.value.blob;
    } else if (image.value.objectUrl) {
      const response = await fetch(image.value.objectUrl);
      imageBlob = await response.blob();
    } else {
      error("无法获取图片数据");
      return;
    }

    // 获取当前选中的AI服务
    const currentService = getCurrentAIService();

    // 初始化AI服务（如果还未初始化）
    await aiImageAnalysisService.initialize();

    let recommendedTags = [];

    // 根据分析模式选择不同的分析方法
    if (analysisMode.value === "ai-direct-recommendation") {
      console.log("🤖 使用AI直接推荐模式");
      recommendedTags = await aiImageAnalysisService.analyzeImage(
        imageBlob,
        image.value.name,
        currentService,
        "ai-direct-recommendation",
        image.value.id
      );
    } else if (analysisMode.value === "similarity-based") {
      console.log("🎯 使用相似图集分析模式");
      recommendedTags = await aiImageAnalysisService.analyzeImage(
        imageBlob,
        image.value.name,
        currentService,
        "similarity-based",
        image.value.id
      );
    } else if (analysisMode.value === "visual-similarity") {
      console.log("🎯 使用视觉相似性分析模式");
      recommendedTags =
        await aiImageAnalysisService.analyzeImageWithVisualSimilarity(
          imageBlob,
          image.value.name,
          currentService,
          image.value.id
        );
    } else {
      console.log("🧠 使用语义分析模式");
      recommendedTags = await aiImageAnalysisService.analyzeImage(
        imageBlob,
        image.value.name,
        currentService,
        "semantic-analysis",
        image.value.id
      );
    }

    if (recommendedTags.length === 0) {
      error("AI分析未找到合适的标签");
      return;
    }

    // 过滤掉已存在的标签
    const existingTags = new Set(
      (image.value.tags || []).map((tag) => tag.toLowerCase())
    );
    const newTags = recommendedTags.filter(
      (tagData) => !existingTags.has(tagData.tag.toLowerCase())
    );

    if (newTags.length === 0) {
      error("所有推荐标签都已存在");
      return;
    }

    aiAnalysisResult.value = newTags;
    selectedAITags.value.clear();

    const modeText =
      analysisMode.value === "similarity-based"
        ? "相似图集"
        : analysisMode.value === "visual-similarity"
        ? "视觉相似性"
        : "语义";
    success(`${modeText}分析完成，找到 ${newTags.length} 个推荐标签`);
  } catch (err) {
    console.error("AI分析失败:", err);
    error("AI分析失败，请检查API配置");
  } finally {
    isAnalyzing.value = false;
  }
}

function toggleAITag(tag) {
  if (selectedAITags.value.has(tag)) {
    selectedAITags.value.delete(tag);
  } else {
    selectedAITags.value.add(tag);
  }
}

async function addSelectedAITags() {
  if (selectedAITags.value.size === 0) {
    warning("请先选择要添加的标签");
    return;
  }

  if (!image.value) return;

  try {
    const tagsToAdd = Array.from(selectedAITags.value);

    // 确保tags字段存在
    if (!image.value.tags) {
      image.value.tags = [];
    }

    // 添加新标签（避免重复）
    const newTags = [...image.value.tags];
    tagsToAdd.forEach((tag) => {
      if (!newTags.includes(tag)) {
        newTags.push(tag);
      }
    });

    // 更新本地状态
    image.value.tags = newTags;

    // 保存到数据库
    await updateImage(image.value.id, { tags: newTags });

    success(`成功添加 ${tagsToAdd.length} 个AI推荐标签`);

    // 清除AI分析结果
    clearAIAnalysis();
  } catch (err) {
    error("添加标签失败");
    // 恢复本地状态
    if (image.value.tags) {
      image.value.tags = image.value.tags.filter(
        (tag) => !selectedAITags.value.has(tag)
      );
    }
  }
}

function clearAIAnalysis() {
  aiAnalysisResult.value = [];
  selectedAITags.value.clear();
}

function goToAISettings() {
  router.push({ name: "Settings", query: { tab: "ai-config" } });
}

function showAILogs() {
  router.push("/ai-analysis-logs");
}
</script>

<style scoped>
.detail-wrapper {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 固定顶部栏 */
.fixed-header {
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  background: rgba(245, 245, 245, 0.9);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  max-width: 1200px;
  margin: 0 auto;
}

/* 内容区域 */
.content-wrapper {
  flex: 1;
  /* padding: 24px; */
  overflow-y: auto;
  min-height: 0;
}

/* 返回图标按钮样式 */
.back-icon-button {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: #606266;
  transition: color 0.2s ease;
}

.back-icon-button:hover {
  color: #4e4f52;
}

.back-icon-button .el-icon {
  font-size: 20px;
}

.delete-icon-button {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: #ff6b6b;
}

.delete-icon-button.disabled {
  cursor: not-allowed;
  color: #c0c4cc;
}

.delete-icon-button .el-icon {
  font-size: 18px;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
  min-height: 0;
}

/* 左侧图片区域 */
.image-section {
  width: 100%;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.image-viewport {
  width: 100%;
  /* max-width: 700px; */
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  overflow: hidden;
}

.image-container img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  cursor: pointer;
}

/* 组图轮播条样式 */
.group-carousel {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
}

/* 右侧信息区域 */
.info-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding: 24px;
}

.info-section-item {
  position: relative;
}

.section-title {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #2c3e50;
  font-weight: 600;
  position: relative;
  padding-left: 12px;
}

.section-title::before {
  content: "";
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 2px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.tag-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

/* AI分析容器和面板样式 */
.ai-analyze-container {
  position: relative;
  display: inline-block;
}

.analysis-mode-panel {
  position: absolute;
  bottom: 100%;
  right: 0;
  margin-bottom: 8px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  z-index: 1000;
  width: 240px;
  overflow: hidden;
  animation: fadeInUp 0.2s ease-out;
}

.hover-bridge {
  position: absolute;
  bottom: -8px;
  left: 0;
  right: 0;
  height: 8px;
  background: transparent;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.panel-header {
  padding: 8px 12px;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
}

.panel-title {
  font-size: 12px;
  font-weight: 500;
  color: #2c3e50;
}

.mode-options {
  padding: 4px 0;
}

.mode-option {
  display: flex;
  align-items: flex-start;
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
}

.mode-option:hover {
  background: #f0f4ff;
}

.mode-option.active {
  background: #e6f0ff;
  border-left: 3px solid #667eea;
}

.mode-radio {
  margin: 0 8px 0 0;
  margin-top: 2px;
  cursor: pointer;
  transform: scale(0.9);
}

.mode-content {
  flex: 1;
}

.mode-title {
  font-weight: 500;
  color: #2c3e50;
  font-size: 12px;
  margin-bottom: 1px;
}

.mode-description {
  font-size: 10px;
  color: #8a9ba8;
  line-height: 1.3;
}

.ai-analyze-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  border: none !important;
  color: white !important;
}

.ai-analyze-button:hover {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%) !important;
}

.ai-analyze-button-disabled {
  background: #f5f5f5 !important;
  color: #c0c4cc !important;
  cursor: not-allowed !important;
}

.ai-analyze-button-disabled:hover {
  background: #f5f5f5 !important;
  color: #c0c4cc !important;
}

.ai-config-button {
  background: #f5f5f5 !important;
  border-color: #d9d9d9 !important;
  color: #666 !important;
}

.ai-config-button:hover {
  background: #e6e6e6 !important;
  border-color: #d9d9d9 !important;
  color: #333 !important;
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.info-row:hover {
  background: rgba(102, 126, 234, 0.02);
  border-radius: 6px;
  padding-left: 8px;
  padding-right: 8px;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-weight: 500;
  color: #5a6c7d;
  font-size: 14px;
  min-width: 80px;
}

.info-value {
  color: #2c3e50;
  font-weight: 400;
  text-align: right;
  flex: 1;
  margin-left: 16px;
  font-size: 14px;
}

.notes-container {
  position: relative;
}

/* 显示模式样式 */
.notes-display {
  min-height: 120px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 8px;
  backdrop-filter: blur(10px);
  cursor: pointer;
  transition: all 0.3s ease;
}

.notes-display:hover {
  background: rgba(255, 255, 255, 0.8);
  transform: translateY(-1px);
}

.notes-content {
  color: #2c3e50;
  line-height: 1.6;
  font-size: 14px;
  white-space: pre-wrap;
  word-break: break-word;
}

.notes-placeholder {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #8a9ba8;
  font-size: 14px;
  min-height: 20px;
}

.placeholder-text {
  flex: 1;
}

.edit-icon {
  opacity: 0.6;
  transition: opacity 0.2s ease;
}

.notes-display:hover .edit-icon {
  opacity: 1;
}

/* 编辑模式样式 */
.notes-edit {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  padding: 16px;
}

.notes-input {
  border: none;
  background: transparent;
  resize: none;
}

.notes-input:focus {
  outline: none;
}

/* 标签区域样式 */
.tags-container {
  position: relative;
}

.tags-display {
  min-height: 80px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 8px;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.tags-display:hover {
  background: rgba(255, 255, 255, 0.8);
}

.tag-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(102, 126, 234, 0.2);
}

.tag-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
}

.tag-remove {
  font-size: 12px;
  opacity: 0.8;
  transition: opacity 0.2s ease;
}

.tag-item:hover .tag-remove {
  opacity: 1;
}

.add-tag-section {
  margin-top: 8px;
}

.tag-input {
  width: 100%;
}

.tag-input :deep(.el-input__wrapper) {
  border-radius: 20px;
  border: 1px solid #e0e0e0;
  background: rgba(255, 255, 255, 0.8);
  transition: all 0.2s ease;
}

.tag-input :deep(.el-input__wrapper:hover) {
  border-color: #667eea;
}

.tag-input :deep(.el-input__wrapper.is-focus) {
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
}

/* 添加标签按钮样式 */
.add-tag-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: rgba(102, 126, 234, 0.1);
  border: 2px dashed rgba(102, 126, 234, 0.3);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #667eea;
}

.add-tag-button:hover {
  background: rgba(102, 126, 234, 0.2);
  border-color: rgba(102, 126, 234, 0.5);
  transform: scale(1.05);
}

.add-tag-button .el-icon {
  font-size: 16px;
}

/* 正在添加的标签样式 */
.adding-tag {
  background: rgba(102, 126, 234, 0.1) !important;
  border: 2px solid #667eea !important;
  min-width: 80px;
  transition: width 0.2s ease;
}

.tag-input-field {
  background: transparent;
  border: none;
  outline: none;
  color: #2c3e50;
  font-size: 13px;
  font-weight: 500;
  width: 100%;
  padding: 0;
  margin: 0;
}

.tag-input-field::placeholder {
  color: #8a9ba8;
}

/* AI分析结果样式 */
.ai-analysis-result {
  margin-bottom: 20px;
  padding: 16px;
  background: rgba(102, 126, 234, 0.05);
  border: 1px solid rgba(102, 126, 234, 0.2);
  border-radius: 8px;
}

.ai-result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.ai-result-title {
  font-size: 14px;
  font-weight: 600;
  color: #667eea;
}

.ai-result-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.view-logs-button {
  color: #409eff !important;
  font-size: 12px !important;
}

.view-logs-button:hover {
  color: #337ecc !important;
}

.clear-ai-button {
  color: #999 !important;
  font-size: 12px !important;
}

.clear-ai-button:hover {
  color: #666 !important;
}

.ai-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.ai-tag-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(102, 126, 234, 0.3);
  border-radius: 16px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.ai-tag-item:hover {
  background: rgba(102, 126, 234, 0.1);
  border-color: rgba(102, 126, 234, 0.5);
}

.ai-tag-selected {
  background: rgba(102, 126, 234, 0.2) !important;
  border-color: #667eea !important;
  color: #667eea !important;
}

.ai-tag-text {
  font-weight: 500;
}

.ai-tag-confidence {
  font-size: 11px;
  color: #999;
  background: rgba(0, 0, 0, 0.05);
  padding: 2px 6px;
  border-radius: 8px;
}

.ai-tag-selected .ai-tag-confidence {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}

.ai-tag-check {
  font-size: 12px;
  color: #667eea;
}

.ai-tag-content {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
}

.ai-tag-category {
  font-size: 10px;
  color: #8a9ba8;
  background: rgba(138, 155, 168, 0.1);
  padding: 2px 6px;
  border-radius: 6px;
  margin-left: 4px;
}

.ai-actions {
  display: flex;
  justify-content: flex-end;
}

.add-ai-tags-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  border: none !important;
  color: white !important;
  font-size: 12px !important;
  padding: 6px 16px !important;
}

.add-ai-tags-button:hover {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%) !important;
}

.add-ai-tags-button:disabled {
  background: #f5f5f5 !important;
  color: #c0c4cc !important;
}

.empty {
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
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

/* 响应式 */
</style>
