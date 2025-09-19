<template>
  <div class="ai-analysis-logs">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">AI分析日志</h1>
        <p class="page-description">查看和管理AI图片分析的详细记录</p>
      </div>
      <div class="header-actions">
        <el-button @click="refreshLogs" :loading="loading" type="primary">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button @click="exportAllLogs" :disabled="logs.length === 0">
          <el-icon><Download /></el-icon>
          导出所有日志
        </el-button>
        <el-button @click="clearAllLogs" :disabled="logs.length === 0">
          <el-icon><Delete /></el-icon>
          清空日志
        </el-button>
      </div>
    </div>

    <!-- 日志列表 -->
    <div class="logs-section">
      <div class="section-header">
        <h2 class="section-title">分析记录</h2>
        <span class="section-count" v-if="logs.length > 0"
          >共 {{ logs.length }} 条记录</span
        >
      </div>

      <div class="logs-list">
        <div v-for="log in logs" :key="log.id" class="log-item">
          <div class="log-content-wrapper">
            <!-- 图片缩略图 -->
            <div class="log-thumbnail">
              <img
                v-if="log.imageData"
                :src="log.imageData"
                :alt="log.imageName"
                class="thumbnail-image"
                @error="handleImageError(log)"
              />
              <div v-else class="thumbnail-placeholder">
                <el-icon><Picture /></el-icon>
                <span>无图片</span>
              </div>
            </div>

            <!-- 日志信息 -->
            <div class="log-info">
              <div class="log-meta">
                <div class="meta-content">
                  <el-tag
                    v-if="log.analysisType"
                    size="small"
                    type="primary"
                    class="analysis-mode-tag"
                  >
                    {{ getAnalysisModeText(log.analysisType) }}
                  </el-tag>
                  <el-tag
                    :type="getStatusType(log.status)"
                    size="small"
                    class="status-tag"
                  >
                    {{ getStatusText(log.status) }}
                  </el-tag>
                  <span class="meta-item">
                    <span class="meta-label">耗时:</span>
                    <span class="meta-value"
                      >{{ (log.duration / 1000).toFixed(2) }}秒</span
                    >
                  </span>
                </div>
                <div class="meta-actions">
                  <div class="button-wrapper">
                    <el-button
                      size="small"
                      @click="deleteLog(log)"
                      circle
                      :title="'删除日志'"
                    >
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </div>
                </div>
              </div>

              <div class="log-content">
                <div class="log-content-main">
                  <div
                    class="log-results"
                    v-if="log.results && log.results.length > 0"
                  >
                    <div class="results-title">
                      {{ log.results.length }}个推荐结果:
                    </div>
                    <div class="results-list">
                      <el-tag
                        v-for="(result, index) in log.results.slice(0, 10)"
                        :key="index"
                        size="small"
                        class="result-tag"
                      >
                        {{ result.tag }}
                      </el-tag>
                      <span v-if="log.results.length > 10" class="more-results">
                        等{{ log.results.length }}个标签
                      </span>
                    </div>
                  </div>
                </div>

                <!-- 操作按钮 -->
                <div class="log-actions">
                  <span class="action-model">
                    {{ getModelDisplayName(log) }}
                  </span>
                  <div class="action-right">
                    <span class="action-time">{{
                      formatTime(log.timestamp)
                    }}</span>

                    <div class="action-buttons">
                      <div class="button-wrapper">
                        <el-button
                          size="small"
                          @click="goToLogDetail(log)"
                          circle
                          :title="'查看详情'"
                        >
                          <el-icon><View /></el-icon>
                        </el-button>
                      </div>
                      <div class="button-wrapper">
                        <el-button
                          size="small"
                          @click="exportLog(log)"
                          circle
                          :title="'导出日志'"
                        >
                          <el-icon><Download /></el-icon>
                        </el-button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="logs.length === 0" class="empty-state">
          <el-empty description="暂无分析日志">
            <el-button type="primary" @click="refreshLogs">刷新</el-button>
          </el-empty>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { Refresh, Download, Delete, View, Picture } from "@/utils/icons";
import { aiImageAnalysisService } from "@/services/AIImageAnalysisService.js";
import { getImageById } from "@/utils/idb.js";

const router = useRouter();

// 响应式数据
const logs = ref([]);
const loading = ref(false);

// 计算属性
const getStatusType = (status) => {
  switch (status) {
    case "completed":
      return "success";
    case "failed":
      return "danger";
    case "processing":
      return "warning";
    default:
      return "info";
  }
};

const getStatusText = (status) => {
  switch (status) {
    case "completed":
      return "完成";
    case "failed":
      return "失败";
    case "processing":
      return "处理中";
    default:
      return "未知";
  }
};

const getAnalysisModeText = (analysisType) => {
  switch (analysisType) {
    case "ai-direct-recommendation":
      return "AI直接推荐";
    case "similarity-based":
      return "相似度推荐";
    case "visual-similarity":
      return "视觉相似度";
    case "semantic-analysis":
      return "语义分析";
    default:
      return "未知模式";
  }
};

const getModelDisplayName = (log) => {
  if (log.modelName) {
    return `${log.modelName} (${log.aiService})`;
  }
  return log.aiService || "未知模型";
};

// 方法
const refreshLogs = async () => {
  loading.value = true;
  try {
    const analysisLogs = aiImageAnalysisService.getAnalysisLogs();
    console.log("📋 获取到的分析日志:", analysisLogs);

    // 为每个日志获取对应的图片数据
    const logsWithImages = await Promise.all(
      analysisLogs.map(async (log) => {
        console.log(`🔍 处理日志 ${log.id}:`, {
          imageId: log.imageId,
          imageName: log.imageName,
          hasImageId: !!log.imageId,
        });

        if (log.imageId) {
          try {
            console.log(`📸 尝试获取图片数据，ID: ${log.imageId}`);
            const imageData = await getImageById(log.imageId);
            console.log(`📸 获取到的图片数据:`, imageData);

            if (imageData && imageData.blob) {
              // 直接使用blob创建图片URL
              log.imageData = URL.createObjectURL(imageData.blob);
              console.log(`✅ 成功创建图片URL:`, log.imageData);
            } else {
              console.warn(`❌ 图片数据为空或无效:`, imageData);
            }
          } catch (error) {
            console.warn(`❌ 获取图片 ${log.imageId} 失败:`, error);
          }
        } else {
          console.warn(`❌ 日志 ${log.id} 没有imageId`);
        }
        return log;
      })
    );

    console.log("📋 最终处理后的日志:", logsWithImages);
    logs.value = logsWithImages;
  } catch (error) {
    ElMessage.error("获取日志失败: " + error.message);
  } finally {
    loading.value = false;
  }
};

const goToLogDetail = (log) => {
  router.push(`/ai-analysis-logs/${log.id}`);
};

const exportLog = (log) => {
  try {
    const logData = aiImageAnalysisService.exportAnalysisLogs(log.id, "text");
    const blob = new Blob([logData], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ai-analysis-log-${log.id}-${formatTime(
      log.timestamp
    ).replace(/[: ]/g, "-")}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    ElMessage.success("日志导出成功");
  } catch (error) {
    ElMessage.error("导出失败: " + error.message);
  }
};

const deleteLog = (log) => {
  ElMessageBox.confirm(`确定要删除分析日志 "${log.id}" 吗？`, "确认删除", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(() => {
      try {
        aiImageAnalysisService.deleteAnalysisLog(log.id);
        ElMessage.success("日志删除成功");
        refreshLogs();
      } catch (error) {
        ElMessage.error("删除失败: " + error.message);
      }
    })
    .catch(() => {
      // 用户取消删除
    });
};

const exportAllLogs = () => {
  try {
    const logData = aiImageAnalysisService.exportAnalysisLogs(null, "text");
    const blob = new Blob([logData], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ai-analysis-logs-${new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/:/g, "-")}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    ElMessage.success("所有日志导出成功");
  } catch (error) {
    ElMessage.error("导出失败: " + error.message);
  }
};

const clearAllLogs = () => {
  ElMessageBox.confirm(
    "确定要清空所有分析日志吗？此操作不可恢复。",
    "确认清空",
    {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    }
  )
    .then(async () => {
      await aiImageAnalysisService.clearAnalysisLogs();
      await refreshLogs();
      ElMessage.success("日志已清空");
    })
    .catch(() => {
      // 用户取消
    });
};

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleString("zh-CN");
};

const handleImageError = (log) => {
  // 图片加载失败时，移除imageData
  console.warn(`❌ 图片加载失败:`, log);
  log.imageData = null;
};

// 测试方法：手动测试图片数据获取
const testImageData = async () => {
  console.log("🧪 开始测试图片数据获取...");

  // 获取所有图片
  const { getAllImages } = await import("@/utils/idb.js");
  const allImages = await getAllImages();
  console.log("📸 所有图片:", allImages);

  if (allImages.length > 0) {
    const firstImage = allImages[0];
    console.log("📸 第一张图片:", firstImage);

    // 测试获取图片数据
    try {
      const imageData = await getImageById(firstImage.id);
      console.log("📸 获取到的图片数据:", imageData);

      if (imageData && imageData.blob) {
        const url = URL.createObjectURL(imageData.blob);
        console.log("✅ 成功创建图片URL:", url);
      }
    } catch (error) {
      console.error("❌ 测试获取图片数据失败:", error);
    }
  }
};

// 生命周期
onMounted(async () => {
  // 先测试图片数据获取
  await testImageData();
  // 然后刷新日志
  refreshLogs();
});
</script>

<style scoped>
.ai-analysis-logs {
  padding: 0;

  min-height: 100vh; /* 减去侧边栏高度 */
  overflow-y: auto;
}

/* 页面头部 */
.page-header {
  border-bottom: 1px solid #e0e0e0;
  background: #fafafa;
  color: #333;
  padding: 24px 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content {
  flex: 1;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #333;
}

.page-description {
  font-size: 14px;
  margin: 0;
  opacity: 0.9;
  color: #666;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.section-header {
  margin-bottom: 20px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.section-count {
  font-size: 14px;
  color: #909399;
  margin-left: 12px;
}

/* 日志列表区域 */
.logs-section {
  background: transparent;
  margin: 0 24px 24px 24px;
  padding: 24px;
}

.logs-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.log-item {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
}

.log-item:hover {
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  /* transform: translateY(-2px); */
}

.log-content-wrapper {
  display: flex;
  gap: 16px;
}

.log-thumbnail {
  flex-shrink: 0;
  width: 160px;
  height: 160px;
  border-radius: 8px;
  overflow: hidden;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
}

.thumbnail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnail-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #909399;
  font-size: 12px;
  gap: 4px;
}

.log-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.status-tag {
  font-weight: 500;
}

.log-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.meta-content {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.meta-actions {
  display: flex;
  align-items: center;
}

.analysis-mode-tag {
  font-weight: 500;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.meta-label {
  font-weight: 500;
  color: #909399;
}

.meta-value {
  color: #909399;
  font-weight: 400;
}

.log-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}

.action-time {
  font-size: 12px;
  color: #909399;
  margin-right: 8px;
}

.action-model {
  font-size: 12px;
  color: #909399;
}

.action-right {
  display: flex;
  gap: 8px;
  align-items: center;
}

.action-buttons {
  display: flex;
  gap: 4px;
  align-items: center;
}

.button-wrapper {
  display: inline-block;
}

.log-actions .el-button {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

.log-actions .el-button:hover {
  background: rgba(0, 0, 0, 0.05) !important;
}

.log-actions .el-button--primary {
  color: #409eff !important;
}

.log-actions .el-button--primary:hover {
  background: rgba(64, 158, 255, 0.1) !important;
}

.log-content {
  margin-top: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 60px;
  flex: 1;
}

.log-content-main {
  flex: 1;
}

.log-results {
  margin-top: 0;
}

.results-title {
  font-weight: 600;
  margin-bottom: 12px;
  color: #303133;
  font-size: 14px;
}

.results-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.result-tag {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.more-results {
  color: #909399;
  font-size: 13px;
  font-style: italic;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  border: 2px dashed rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(10px);
}
</style>
