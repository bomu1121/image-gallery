<template>
  <div class="ai-log-viewer">
    <div class="log-header">
      <h2>AI分析日志查看器</h2>
      <div class="log-controls">
        <el-button @click="clearLogs" type="danger" size="small">
          <IconDelete />
          清空日志
        </el-button>
        <el-button @click="exportLogs" type="primary" size="small">
          <IconDownload />
          导出日志
        </el-button>
        <el-button
          @click="toggleAutoScroll"
          :type="autoScroll ? 'success' : 'default'"
          size="small"
        >
          <IconArrowDown v-if="autoScroll" />
          <IconArrowUp v-else />
          {{ autoScroll ? "自动滚动" : "手动滚动" }}
        </el-button>
      </div>
    </div>

    <div class="log-stats">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ logStats.totalLogs }}</div>
              <div class="stat-label">总日志数</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ logStats.errorLogs }}</div>
              <div class="stat-label">错误日志</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ logStats.warningLogs }}</div>
              <div class="stat-label">警告日志</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ logStats.infoLogs }}</div>
              <div class="stat-label">信息日志</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <div class="log-filters">
      <el-row :gutter="20">
        <el-col :span="8">
          <el-select
            v-model="logLevel"
            placeholder="选择日志级别"
            clearable
            @change="filterLogs"
          >
            <el-option label="全部" value="" />
            <el-option label="错误" value="error" />
            <el-option label="警告" value="warn" />
            <el-option label="信息" value="info" />
            <el-option label="调试" value="debug" />
          </el-select>
        </el-col>
        <el-col :span="8">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索日志内容"
            @input="filterLogs"
            clearable
          >
            <template #prefix>
              <IconSearch />
            </template>
          </el-input>
        </el-col>
        <el-col :span="8">
          <el-date-picker
            v-model="dateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            @change="filterLogs"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-col>
      </el-row>
    </div>

    <div class="log-container" ref="logContainer">
      <div v-if="filteredLogs.length === 0" class="no-logs">
        <IconDocument />
        <p>暂无日志数据</p>
        <p class="hint">请先进行AI分析操作</p>
      </div>

      <div v-else class="log-list">
        <div
          v-for="(log, index) in filteredLogs"
          :key="index"
          :class="['log-item', `log-${log.level}`]"
        >
          <div class="log-time">{{ formatTime(log.timestamp) }}</div>
          <div class="log-level">{{ log.level.toUpperCase() }}</div>
          <div class="log-content">{{ log.message }}</div>
          <div v-if="log.data" class="log-data">
            <el-button @click="toggleLogData(index)" size="small" type="text">
              {{ expandedLogs.has(index) ? "收起" : "展开" }}
            </el-button>
            <div v-if="expandedLogs.has(index)" class="log-data-content">
              <pre>{{ JSON.stringify(log.data, null, 2) }}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  ref,
  reactive,
  computed,
  onMounted,
  onUnmounted,
  nextTick,
  watch,
} from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Delete as IconDelete,
  Download as IconDownload,
  ArrowDown as IconArrowDown,
  ArrowUp as IconArrowUp,
  Search as IconSearch,
  Document as IconDocument,
} from "@/utils/icons";
import logManager from "@/utils/logManager";

// 响应式数据
const logs = ref([]);
const filteredLogs = ref([]);
const autoScroll = ref(true);
const logLevel = ref("");
const searchKeyword = ref("");
const dateRange = ref([]);
const expandedLogs = ref(new Set());
const logContainer = ref(null);

// 日志统计
const logStats = reactive({
  totalLogs: 0,
  errorLogs: 0,
  warningLogs: 0,
  infoLogs: 0,
});

// 更新日志数据
function updateLogs() {
  logs.value = logManager.getLogs();
  updateLogStats();
}

// 更新日志统计
function updateLogStats() {
  const stats = logManager.getLogStats();
  logStats.totalLogs = stats.totalLogs;
  logStats.errorLogs = stats.errorLogs;
  logStats.warningLogs = stats.warningLogs;
  logStats.infoLogs = stats.infoLogs;
}

// 过滤日志
function filterLogs() {
  const filters = {
    level: logLevel.value || undefined,
    keyword: searchKeyword.value || undefined,
    dateRange: dateRange.value.length === 2 ? dateRange.value : undefined,
  };

  filteredLogs.value = logManager.getFilteredLogs(filters);
}

// 清空日志
function clearLogs() {
  ElMessageBox.confirm("确定要清空所有日志吗？", "确认清空", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(() => {
      logManager.clearLogs();
      updateLogs();
      filteredLogs.value = [];
      ElMessage.success("日志已清空");
    })
    .catch(() => {
      // 用户取消
    });
}

// 导出日志
function exportLogs() {
  if (filteredLogs.value.length === 0) {
    ElMessage.warning("没有日志可导出");
    return;
  }

  const filters = {
    level: logLevel.value || undefined,
    keyword: searchKeyword.value || undefined,
    dateRange: dateRange.value.length === 2 ? dateRange.value : undefined,
  };

  const logText = logManager.exportLogs(filters);

  const blob = new Blob([logText], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `ai-logs-${new Date()
    .toISOString()
    .slice(0, 19)
    .replace(/:/g, "-")}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  ElMessage.success("日志导出成功");
}

// 切换自动滚动
function toggleAutoScroll() {
  autoScroll.value = !autoScroll.value;
  if (autoScroll.value) {
    scrollToBottom();
  }
}

// 滚动到底部
function scrollToBottom() {
  if (logContainer.value) {
    logContainer.value.scrollTop = logContainer.value.scrollHeight;
  }
}

// 切换日志数据展开状态
function toggleLogData(index) {
  if (expandedLogs.value.has(index)) {
    expandedLogs.value.delete(index);
  } else {
    expandedLogs.value.add(index);
  }
}

// 格式化时间
function formatTime(timestamp) {
  return new Date(timestamp).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// 日志监听器回调
function onLogUpdate(log, action) {
  if (action === "clear") {
    updateLogs();
    filteredLogs.value = [];
  } else {
    updateLogs();
    filterLogs();

    // 自动滚动到底部
    if (autoScroll.value) {
      nextTick(() => {
        scrollToBottom();
      });
    }
  }
}

// 监听过滤条件变化
watch([logLevel, searchKeyword, dateRange], () => {
  filterLogs();
});

// 组件挂载
onMounted(() => {
  // 注册日志监听器
  logManager.addListener(onLogUpdate);

  // 初始化日志数据
  updateLogs();
  filterLogs();
});

// 组件卸载
onUnmounted(() => {
  // 移除日志监听器
  logManager.removeListener(onLogUpdate);
});
</script>

<style scoped>
.ai-log-viewer {
  padding: 20px;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.log-header h2 {
  margin: 0;
  color: #303133;
}

.log-controls {
  display: flex;
  gap: 10px;
}

.log-stats {
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
}

.stat-content {
  padding: 10px;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.log-filters {
  margin-bottom: 20px;
}

.log-container {
  flex: 1;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow-y: auto;
  background: #fafafa;
}

.no-logs {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #909399;
}

.no-logs svg {
  font-size: 48px;
  margin-bottom: 16px;
}

.hint {
  font-size: 12px;
  margin-top: 8px;
}

.log-list {
  padding: 10px;
}

.log-item {
  display: flex;
  align-items: flex-start;
  padding: 8px 12px;
  margin-bottom: 4px;
  border-radius: 4px;
  background: white;
  border-left: 4px solid #e4e7ed;
  font-family: "Courier New", monospace;
  font-size: 13px;
  line-height: 1.4;
}

.log-item.log-error {
  border-left-color: #f56c6c;
  background: #fef0f0;
}

.log-item.log-warn {
  border-left-color: #e6a23c;
  background: #fdf6ec;
}

.log-item.log-info {
  border-left-color: #409eff;
  background: #ecf5ff;
}

.log-time {
  min-width: 160px;
  color: #909399;
  font-size: 11px;
  margin-right: 12px;
}

.log-level {
  min-width: 60px;
  font-weight: bold;
  margin-right: 12px;
}

.log-error .log-level {
  color: #f56c6c;
}

.log-warn .log-level {
  color: #e6a23c;
}

.log-info .log-level {
  color: #409eff;
}

.log-content {
  flex: 1;
  word-break: break-all;
  white-space: pre-wrap;
}

.log-data {
  margin-top: 8px;
  width: 100%;
}

.log-data-content {
  margin-top: 8px;
  padding: 8px;
  background: #f5f7fa;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.log-data-content pre {
  margin: 0;
  font-size: 12px;
  color: #606266;
  white-space: pre-wrap;
  word-break: break-all;
}

/* 滚动条样式 */
.log-container::-webkit-scrollbar {
  width: 8px;
}

.log-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.log-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.log-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
