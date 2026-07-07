<template>
  <div class="ai-analysis-log-detail">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <el-button @click="goBack" size="large" type="primary">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <div class="header-info">
          <h1 class="page-title">AI分析日志详情</h1>
          <div class="header-image" v-if="log">
            <img
              v-if="log.imageData"
              :src="log.imageData"
              :alt="log.imageName"
              class="header-thumbnail"
              @error="handleImageError"
            />
            <div v-else class="header-placeholder">
              <el-icon><Picture /></el-icon>
              <span>无图片</span>
            </div>
          </div>
        </div>
      </div>
      <div class="header-actions" v-if="log">
        <el-button @click="exportLog" type="primary">
          <el-icon><Download /></el-icon>
          导出日志
        </el-button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <el-skeleton :rows="10" animated />
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-state">
      <el-empty description="加载失败">
        <el-button @click="loadLog">重新加载</el-button>
      </el-empty>
    </div>

    <!-- 日志详情内容 -->
    <div v-else-if="log" class="log-detail-content">
      <el-tabs v-model="activeTab" class="detail-tabs">
        <el-tab-pane label="基本信息" name="basic">
          <div class="basic-info">
            <div class="info-grid">
              <div class="info-row">
                <span class="info-label">分析ID:</span>
                <span class="info-value">{{ log.id }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">图片名称:</span>
                <span class="info-value">{{ log.imageName }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">AI模型:</span>
                <span class="info-value">{{ getModelDisplayName(log) }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">开始时间:</span>
                <span class="info-value">{{ formatTime(log.timestamp) }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">状态:</span>
                <el-tag :type="getStatusType(log.status)">
                  {{ getStatusText(log.status) }}
                </el-tag>
              </div>
              <div class="info-row">
                <span class="info-label">耗时:</span>
                <span class="info-value"
                  >{{ (log.duration / 1000).toFixed(2) }}秒</span
                >
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="分析步骤" name="steps">
          <div class="steps-list">
            <div v-if="log.steps && log.steps.length > 0">
              <div
                v-for="(step, index) in log.steps"
                :key="index"
                class="step-item"
              >
                <div class="step-header">
                  <span class="step-number">{{ index + 1 }}</span>
                  <span class="step-name">{{ step.step }}</span>
                  <span class="step-time">{{
                    formatTime(step.timestamp)
                  }}</span>
                </div>
                <div
                  v-if="step.data && Object.keys(step.data).length > 0"
                  class="step-data"
                >
                  <pre>{{ JSON.stringify(step.data, null, 2) }}</pre>
                </div>
              </div>
            </div>
            <div v-else class="no-steps">
              <el-empty description="无分析步骤" />
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="分析结果" name="results">
          <div class="results-detail">
            <div v-if="log.results && log.results.length > 0">
              <div
                v-for="(result, index) in log.results"
                :key="index"
                class="result-item"
              >
                <div class="result-header">
                  <span class="result-tag">{{ result.tag }}</span>
                  <span class="result-confidence"
                    >{{ (result.confidence * 100).toFixed(1) }}%</span
                  >
                </div>
                <div class="result-reason">{{ result.reason }}</div>
                <div v-if="result.source" class="result-source">
                  来源: {{ result.source }}
                </div>
              </div>
            </div>
            <div v-else class="no-results">
              <el-empty description="无分析结果" />
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="统计信息" name="statistics">
          <div class="statistics-detail">
            <div v-if="log.statistics">
              <div class="stat-grid">
                <div class="stat-item">
                  <span class="stat-label">特征提取数:</span>
                  <span class="stat-value">{{
                    log.statistics.featuresExtracted
                  }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">相似度比较:</span>
                  <span class="stat-value">{{
                    log.statistics.similarityComparisons
                  }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">推荐生成:</span>
                  <span class="stat-value">{{
                    log.statistics.recommendationsGenerated
                  }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">标签数据库大小:</span>
                  <span class="stat-value">{{
                    log.statistics.tagDatabaseSize
                  }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">总图片数:</span>
                  <span class="stat-value">{{
                    log.statistics.totalImages
                  }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">已处理图片:</span>
                  <span class="stat-value">{{
                    log.statistics.processedImages
                  }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">成功标签:</span>
                  <span class="stat-value">{{
                    log.statistics.successfulTags
                  }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">失败标签:</span>
                  <span class="stat-value">{{
                    log.statistics.failedTags
                  }}</span>
                </div>
              </div>
            </div>
            <div v-else class="no-statistics">
              <el-empty description="无统计信息" />
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="错误信息" name="error" v-if="log.error">
          <div class="error-detail">
            <div class="error-message">
              <strong>错误消息:</strong> {{ log.error.message }}
            </div>
            <div class="error-time">
              <strong>发生时间:</strong> {{ formatTime(log.error.timestamp) }}
            </div>
            <div v-if="log.error.stack" class="error-stack">
              <strong>错误堆栈:</strong>
              <pre>{{ log.error.stack }}</pre>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 日志不存在 -->
    <div v-else class="not-found-state">
      <el-empty description="日志不存在">
        <el-button @click="goBack">返回列表</el-button>
      </el-empty>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { ArrowLeft, Download, Picture } from "@/utils/icons";
import { aiImageAnalysisService } from "@/services/AIImageAnalysisService.js";
import { getImageById } from "@/utils/idb.js";

const route = useRoute();
const router = useRouter();

// 响应式数据
const log = ref(null);
const loading = ref(false);
const error = ref(false);
const activeTab = ref("basic");

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

const getModelDisplayName = (log) => {
  if (log.modelName) {
    return `${log.modelName} (${log.aiService})`;
  }
  return log.aiService || "未知模型";
};

// 方法
const loadLog = async () => {
  const logId = route.params.id;
  if (!logId) {
    error.value = true;
    return;
  }

  loading.value = true;
  error.value = false;

  try {
    // 从AI分析服务获取日志
    const logs = aiImageAnalysisService.getAnalysisLogs();
    const foundLog = logs.find((l) => l.id === logId);

    if (foundLog) {
      console.log("📋 找到的日志:", foundLog);
      console.log("📸 日志的imageId:", foundLog.imageId);

      // 获取图片数据
      if (foundLog.imageId) {
        try {
          console.log(`📸 尝试获取图片数据，ID: ${foundLog.imageId}`);
          const imageData = await getImageById(foundLog.imageId);
          console.log(`📸 获取到的图片数据:`, imageData);

          if (imageData && imageData.blob) {
            // 直接使用blob创建图片URL
            foundLog.imageData = URL.createObjectURL(imageData.blob);
            console.log(`✅ 成功创建图片URL:`, foundLog.imageData);
          } else {
            console.warn(`❌ 图片数据为空或无效:`, imageData);
          }
        } catch (error) {
          console.warn(`❌ 获取图片 ${foundLog.imageId} 失败:`, error);
        }
      } else {
        console.warn(`❌ 日志没有imageId`);
      }
      log.value = foundLog;
    } else {
      error.value = true;
      ElMessage.error("日志不存在");
    }
  } catch (err) {
    error.value = true;
    ElMessage.error("加载日志失败: " + err.message);
  } finally {
    loading.value = false;
  }
};

const goBack = () => {
  router.push("/ai-analysis-logs");
};

const exportLog = () => {
  if (!log.value) return;

  try {
    const logData = aiImageAnalysisService.exportAnalysisLogs(
      log.value.id,
      "text"
    );
    const blob = new Blob([logData], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ai-analysis-log-${log.value.id}-${formatTime(
      log.value.timestamp
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

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleString("zh-CN");
};

const handleImageError = () => {
  // 图片加载失败时，移除imageData
  if (log.value) {
    log.value.imageData = null;
  }
};

// 生命周期
onMounted(() => {
  loadLog();
});
</script>

<style scoped>
.ai-analysis-log-detail {
  padding: 0;

  min-height: 100vh;
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
  display: flex;
  align-items: center;
  gap: 20px;
  flex: 1;
}

.back-button {
  background: rgba(255, 255, 255, 0.2) !important;
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
  color: white !important;
  transition: all 0.3s ease;
}

.back-button:hover {
  background: rgba(255, 255, 255, 0.3) !important;
  border-color: rgba(255, 255, 255, 0.5) !important;
  transform: translateX(-2px);
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

.header-image {
  margin-top: 12px;
}

.header-thumbnail {
  width: 200px;
  height: 200px;
  object-fit: cover;
  border-radius: 12px;
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.header-placeholder {
  width: 200px;
  height: 200px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  border: 2px dashed rgba(255, 255, 255, 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  gap: 8px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

/* 加载状态 */
.loading-state {
  padding: 24px;
}

/* 错误状态 */
.error-state {
  padding: 60px 24px;
  text-align: center;
}

/* 日志详情内容 */
.log-detail-content {
  background: transparent;
  margin: 24px;
  padding: 24px;
}

.detail-tabs {
  min-height: auto;
}

/* 基本信息 */
.basic-info {
  padding: 20px 0;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-weight: 600;
  color: #606266;
  min-width: 100px;
  font-size: 14px;
}

.info-value {
  color: #303133;
  font-size: 14px;
  flex: 1;
}

/* 分析步骤 */
.steps-list {
  max-height: none;
  overflow-y: visible;
}

.step-item {
  margin-bottom: 20px;
  padding: 20px;
  border: none;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0;
  background: transparent;
}

.step-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 12px;
}

.step-number {
  background: #409eff;
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
}

.step-name {
  font-weight: 600;
  color: #303133;
  font-size: 16px;
}

.step-time {
  color: #909399;
  font-size: 14px;
  margin-left: auto;
}

.step-data {
  background: rgba(255, 255, 255, 0.05);
  padding: 12px;
  border-radius: 6px;
  font-size: 13px;
  max-height: 300px;
  overflow-y: auto;
}

.step-data pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
  color: #606266;
}

.no-steps {
  text-align: center;
  padding: 60px 20px;
}

/* 分析结果 */
.results-detail {
  max-height: none;
  overflow-y: visible;
}

.result-item {
  margin-bottom: 20px;
  padding: 20px;
  border: none;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0;
  background: transparent;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.result-tag {
  font-weight: 600;
  color: #303133;
  font-size: 16px;
}

.result-confidence {
  color: #409eff;
  font-weight: 600;
  font-size: 16px;
}

.result-reason {
  color: #606266;
  font-size: 14px;
  margin-bottom: 8px;
}

.result-source {
  color: #909399;
  font-size: 12px;
  font-style: italic;
}

.no-results {
  text-align: center;
  padding: 60px 20px;
}

/* 统计信息 */
.statistics-detail {
  padding: 20px 0;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: none;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.stat-label {
  font-weight: 600;
  color: #606266;
  font-size: 14px;
}

.stat-value {
  color: #303133;
  font-weight: 600;
  font-size: 16px;
}

.no-statistics {
  text-align: center;
  padding: 60px 20px;
}

/* 错误信息 */
.error-detail {
  padding: 20px;
  background: rgba(254, 240, 240, 0.1);
  border: 1px solid rgba(251, 196, 196, 0.3);
  border-radius: 8px;
}

.error-message,
.error-time {
  margin-bottom: 16px;
  font-size: 14px;
}

.error-stack {
  margin-top: 16px;
}

.error-stack pre {
  background: rgba(245, 245, 245, 0.1);
  padding: 12px;
  border-radius: 6px;
  font-size: 12px;
  overflow-x: auto;
  margin-top: 8px;
  max-height: 200px;
  overflow-y: auto;
}

/* 不存在状态 */
.not-found-state {
  padding: 60px 24px;
  text-align: center;
}

/* 响应式 */
@media (max-width: 768px) {
  .page-header {
    padding: 20px 16px;
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .page-title {
    font-size: 24px;
  }

  .log-detail-content {
    margin: 16px;
    padding: 16px;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .stat-grid {
    grid-template-columns: 1fr;
  }
}
</style>
