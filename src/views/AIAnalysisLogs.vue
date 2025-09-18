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
        <el-button
          @click="clearAllLogs"
          type="danger"
          :disabled="logs.length === 0"
        >
          <el-icon><Delete /></el-icon>
          清空日志
        </el-button>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="statistics-section" v-if="statistics">
      <div class="section-header">
        <h2 class="section-title">分析统计</h2>
      </div>
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-value">{{ statistics.total }}</div>
          <div class="stat-label">总分析次数</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ statistics.completed }}</div>
          <div class="stat-label">成功完成</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ statistics.failed }}</div>
          <div class="stat-label">分析失败</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ statistics.successRate }}%</div>
          <div class="stat-label">成功率</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ statistics.avgDuration.toFixed(1) }}s</div>
          <div class="stat-label">平均耗时</div>
        </div>
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
          <div class="log-header">
            <div class="log-info">
              <div class="log-title-row">
                <h3 class="log-title">{{ log.imageName }}</h3>
                <el-tag
                  :type="getStatusType(log.status)"
                  size="small"
                  class="status-tag"
                >
                  {{ getStatusText(log.status) }}
                </el-tag>
              </div>
              <div class="log-meta">
                <span class="meta-item">
                  <span class="meta-label">AI服务:</span>
                  <span class="meta-value">{{ log.aiService }}</span>
                </span>
                <span class="meta-item">
                  <span class="meta-label">开始时间:</span>
                  <span class="meta-value">{{
                    formatTime(log.timestamp)
                  }}</span>
                </span>
                <span class="meta-item">
                  <span class="meta-label">耗时:</span>
                  <span class="meta-value"
                    >{{ (log.duration / 1000).toFixed(2) }}秒</span
                  >
                </span>
              </div>
            </div>
            <div class="log-actions">
              <el-button
                size="small"
                @click="viewLogDetail(log)"
                type="primary"
              >
                <el-icon><View /></el-icon>
                查看详情
              </el-button>
              <el-button size="small" @click="exportLog(log)">
                <el-icon><Download /></el-icon>
                导出
              </el-button>
            </div>
          </div>

          <div class="log-content">
            <div class="log-stats" v-if="log.statistics">
              <div class="stats-row">
                <span class="stat-badge"
                  >特征提取: {{ log.statistics.featuresExtracted }}</span
                >
                <span class="stat-badge"
                  >相似度比较: {{ log.statistics.similarityComparisons }}</span
                >
                <span class="stat-badge"
                  >推荐生成: {{ log.statistics.recommendationsGenerated }}</span
                >
              </div>
            </div>

            <div
              class="log-results"
              v-if="log.results && log.results.length > 0"
            >
              <div class="results-title">推荐结果:</div>
              <div class="results-list">
                <el-tag
                  v-for="(result, index) in log.results.slice(0, 5)"
                  :key="index"
                  size="small"
                  class="result-tag"
                >
                  {{ result.tag }} ({{ (result.confidence * 100).toFixed(1) }}%)
                </el-tag>
                <span v-if="log.results.length > 5" class="more-results">
                  等{{ log.results.length }}个标签
                </span>
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

    <!-- 日志详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="分析日志详情"
      width="80%"
      :before-close="closeDetailDialog"
    >
      <div v-if="selectedLog" class="log-detail">
        <div class="detail-header">
          <h3>{{ selectedLog.imageName }}</h3>
          <div class="detail-actions">
            <el-button @click="exportLog(selectedLog)">
              <el-icon><Download /></el-icon>
              导出此日志
            </el-button>
          </div>
        </div>

        <div class="detail-content">
          <el-tabs v-model="activeTab">
            <el-tab-pane label="基本信息" name="basic">
              <div class="basic-info">
                <div class="info-row">
                  <span class="info-label">分析ID:</span>
                  <span class="info-value">{{ selectedLog.id }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">图片名称:</span>
                  <span class="info-value">{{ selectedLog.imageName }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">AI服务:</span>
                  <span class="info-value">{{ selectedLog.aiService }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">开始时间:</span>
                  <span class="info-value">{{
                    formatTime(selectedLog.timestamp)
                  }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">状态:</span>
                  <el-tag :type="getStatusType(selectedLog.status)">
                    {{ getStatusText(selectedLog.status) }}
                  </el-tag>
                </div>
                <div class="info-row">
                  <span class="info-label">耗时:</span>
                  <span class="info-value"
                    >{{ (selectedLog.duration / 1000).toFixed(2) }}秒</span
                  >
                </div>
              </div>
            </el-tab-pane>

            <el-tab-pane label="分析步骤" name="steps">
              <div class="steps-list">
                <div
                  v-for="(step, index) in selectedLog.steps"
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
            </el-tab-pane>

            <el-tab-pane label="分析结果" name="results">
              <div class="results-detail">
                <div
                  v-if="selectedLog.results && selectedLog.results.length > 0"
                >
                  <div
                    v-for="(result, index) in selectedLog.results"
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
                  </div>
                </div>
                <div v-else class="no-results">
                  <el-empty description="无分析结果" />
                </div>
              </div>
            </el-tab-pane>

            <el-tab-pane label="统计信息" name="statistics">
              <div class="statistics-detail">
                <div v-if="selectedLog.statistics">
                  <div class="stat-row">
                    <span class="stat-label">特征提取数:</span>
                    <span class="stat-value">{{
                      selectedLog.statistics.featuresExtracted
                    }}</span>
                  </div>
                  <div class="stat-row">
                    <span class="stat-label">相似度比较:</span>
                    <span class="stat-value">{{
                      selectedLog.statistics.similarityComparisons
                    }}</span>
                  </div>
                  <div class="stat-row">
                    <span class="stat-label">推荐生成:</span>
                    <span class="stat-value">{{
                      selectedLog.statistics.recommendationsGenerated
                    }}</span>
                  </div>
                  <div class="stat-row">
                    <span class="stat-label">标签数据库大小:</span>
                    <span class="stat-value">{{
                      selectedLog.statistics.tagDatabaseSize
                    }}</span>
                  </div>
                </div>
              </div>
            </el-tab-pane>

            <el-tab-pane label="错误信息" name="error" v-if="selectedLog.error">
              <div class="error-detail">
                <div class="error-message">
                  <strong>错误消息:</strong> {{ selectedLog.error.message }}
                </div>
                <div class="error-time">
                  <strong>发生时间:</strong>
                  {{ formatTime(selectedLog.error.timestamp) }}
                </div>
                <div v-if="selectedLog.error.stack" class="error-stack">
                  <strong>错误堆栈:</strong>
                  <pre>{{ selectedLog.error.stack }}</pre>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Refresh, Download, Delete, View } from "@/utils/icons";
import { aiImageAnalysisService } from "@/services/AIImageAnalysisService.js";

// 响应式数据
const logs = ref([]);
const statistics = ref(null);
const loading = ref(false);
const detailDialogVisible = ref(false);
const selectedLog = ref(null);
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

// 方法
const refreshLogs = async () => {
  loading.value = true;
  try {
    logs.value = aiImageAnalysisService.getAnalysisLogs();
    // 从数据库获取完整统计信息
    statistics.value = await aiImageAnalysisService.getAnalysisStatistics(true);
  } catch (error) {
    ElMessage.error("获取日志失败: " + error.message);
  } finally {
    loading.value = false;
  }
};

const viewLogDetail = (log) => {
  selectedLog.value = log;
  activeTab.value = "basic";
  detailDialogVisible.value = true;
};

const closeDetailDialog = () => {
  detailDialogVisible.value = false;
  selectedLog.value = null;
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

// 生命周期
onMounted(() => {
  refreshLogs();
});
</script>

<style scoped>
.ai-analysis-logs {
  padding: 0;
  background: #f5f7fa;
  min-height: calc(100vh - 60px); /* 减去侧边栏高度 */
  overflow-y: auto;
  padding-bottom: 40px; /* 底部留白 */
}

/* 页面头部 */
.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 40px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content {
  flex: 1;
}

.page-title {
  font-size: 32px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: white;
}

.page-description {
  font-size: 16px;
  margin: 0;
  opacity: 0.9;
  color: white;
}

.header-actions {
  display: flex;
  gap: 12px;
}

/* 统计信息区域 */
.statistics-section {
  background: white;
  margin: 24px;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
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

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 24px;
}

.stat-item {
  text-align: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.stat-item:hover {
  background: #e9ecef;
  transform: translateY(-2px);
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #409eff;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

/* 日志列表区域 */
.logs-section {
  background: white;
  margin: 0 24px 24px 24px;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.logs-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.log-item {
  background: #fafbfc;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 20px;
  transition: all 0.3s ease;
}

.log-item:hover {
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.1);
  transform: translateY(-1px);
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.log-info {
  flex: 1;
}

.log-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.log-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.status-tag {
  font-weight: 500;
}

.log-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}

.meta-label {
  font-weight: 500;
  color: #606266;
}

.meta-value {
  color: #303133;
  font-weight: 500;
}

.log-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.log-content {
  border-top: 1px solid #e4e7ed;
  padding-top: 16px;
}

.log-stats {
  margin-bottom: 16px;
}

.stats-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.stat-badge {
  background: #e1f5fe;
  color: #0277bd;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 500;
}

.log-results {
  margin-top: 16px;
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
  font-weight: 500;
}

.more-results {
  color: #909399;
  font-size: 13px;
  font-style: italic;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: #fafbfc;
  border-radius: 8px;
  border: 2px dashed #e4e7ed;
}

.log-detail {
  max-height: 70vh;
  overflow-y: auto;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
}

.detail-header h3 {
  margin: 0;
  color: #303133;
}

.detail-actions {
  display: flex;
  gap: 10px;
}

.basic-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 15px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.info-label {
  font-weight: bold;
  color: #606266;
  min-width: 100px;
}

.info-value {
  color: #303133;
}

.steps-list {
  max-height: 400px;
  overflow-y: auto;
}

.step-item {
  margin-bottom: 20px;
  padding: 15px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
}

.step-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 10px;
}

.step-number {
  background: #409eff;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

.step-name {
  font-weight: bold;
  color: #303133;
}

.step-time {
  color: #909399;
  font-size: 14px;
  margin-left: auto;
}

.step-data {
  background: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
  font-size: 12px;
}

.step-data pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}

.results-detail {
  max-height: 400px;
  overflow-y: auto;
}

.result-item {
  margin-bottom: 15px;
  padding: 15px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.result-tag {
  font-weight: bold;
  color: #303133;
}

.result-confidence {
  color: #409eff;
  font-weight: bold;
}

.result-reason {
  color: #606266;
  font-size: 14px;
}

.no-results {
  text-align: center;
  padding: 40px;
}

.statistics-detail {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
}

.stat-label {
  font-weight: bold;
  color: #606266;
}

.stat-value {
  color: #303133;
  font-weight: bold;
}

.error-detail {
  padding: 20px;
  background: #fef0f0;
  border: 1px solid #fbc4c4;
  border-radius: 8px;
}

.error-message,
.error-time {
  margin-bottom: 15px;
}

.error-stack {
  margin-top: 15px;
}

.error-stack pre {
  background: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  font-size: 12px;
  overflow-x: auto;
}
</style>
