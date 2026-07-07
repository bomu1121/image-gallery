<template>
  <div class="sync-status-monitor" v-if="showMonitor">
    <!-- 同步状态指示器 -->
    <div class="sync-indicator" :class="getStatusClass()">
      <el-icon class="status-icon">
        <component :is="getStatusIcon()" />
      </el-icon>
      <span class="status-text">{{ getStatusText() }}</span>
      <span v-if="lastSyncTime" class="last-sync">
        上次同步: {{ formatTime(lastSyncTime) }}
      </span>
    </div>

    <!-- 同步进度条 -->
    <div v-if="syncProgress.show" class="sync-progress">
      <div class="progress-info">
        <span>{{ syncProgress.message }}</span>
        <span>{{ syncProgress.current }}/{{ syncProgress.total }}</span>
      </div>
      <el-progress
        :percentage="syncProgress.percentage"
        :status="syncProgress.status"
        :show-text="false"
      />
    </div>

    <!-- 错误信息 -->
    <div v-if="errorMessage" class="error-message">
      <el-icon class="error-icon"><Warning /></el-icon>
      <span>{{ errorMessage }}</span>
      <el-button
        type="text"
        size="small"
        @click="retrySync"
        :loading="retrying"
      >
        重试
      </el-button>
    </div>

    <!-- 快速操作 -->
    <div class="quick-actions">
      <el-button
        v-if="activeServer"
        type="primary"
        size="small"
        :loading="syncing"
        @click="manualSync"
      >
        <el-icon><Refresh /></el-icon>
        {{ syncing ? "同步中..." : "立即同步" }}
      </el-button>

      <el-button type="info" size="small" @click="showDetails = !showDetails">
        <el-icon><Grid /></el-icon>
        {{ showDetails ? "隐藏详情" : "查看详情" }}
      </el-button>
    </div>

    <!-- 详细状态信息 -->
    <div v-if="showDetails" class="sync-details">
      <div class="detail-section">
        <h4>当前服务器</h4>
        <div v-if="activeServer" class="server-info">
          <span class="server-name">{{ activeServer.name }}</span>
          <span class="server-url">{{ activeServer.baseUrl }}</span>
          <el-tag :type="getServerStatusType(activeServer.status)" size="small">
            {{ getServerStatusText(activeServer.status) }}
          </el-tag>
        </div>
        <div v-else class="no-server">
          <el-icon><Warning /></el-icon>
          <span>未配置云服务器</span>
        </div>
      </div>

      <div class="detail-section">
        <h4>同步统计</h4>
        <div class="sync-stats">
          <div class="stat-item">
            <span class="stat-label">总同步次数:</span>
            <span class="stat-value">{{ syncStats.totalSyncs }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">成功次数:</span>
            <span class="stat-value success">{{
              syncStats.successfulSyncs
            }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">失败次数:</span>
            <span class="stat-value error">{{ syncStats.failedSyncs }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">最后同步:</span>
            <span class="stat-value">{{
              lastSyncTime ? formatTime(lastSyncTime) : "从未同步"
            }}</span>
          </div>
        </div>
      </div>

      <div class="detail-section">
        <h4>自动同步设置</h4>
        <div class="auto-sync-info">
          <el-tag
            :type="syncSettings.autoSync ? 'success' : 'info'"
            size="small"
          >
            {{ syncSettings.autoSync ? "已启用" : "已禁用" }}
          </el-tag>
          <span v-if="syncSettings.autoSync" class="sync-interval">
            间隔: {{ getSyncIntervalText(syncSettings.syncInterval) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { ElMessage } from "element-plus";
import { Refresh, Warning, Grid, Loading } from "@element-plus/icons-vue";
import { useCloudSync } from "../composables/useCloudSync";

const props = defineProps({
  show: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(["syncComplete", "syncError"]);

// 使用云同步组合式函数
const { activeServer, syncSettings, syncServer, getServerStatus } =
  useCloudSync();

// 状态
const showMonitor = computed(() => props.show);
const showDetails = ref(false);
const syncing = ref(false);
const retrying = ref(false);
const lastSyncTime = ref(null);
const errorMessage = ref("");

// 同步进度
const syncProgress = ref({
  show: false,
  message: "",
  current: 0,
  total: 0,
  percentage: 0,
  status: "success",
});

// 同步统计
const syncStats = ref({
  totalSyncs: 0,
  successfulSyncs: 0,
  failedSyncs: 0,
});

// 获取状态样式类
const getStatusClass = () => {
  if (syncing.value) return "status-syncing";
  if (errorMessage.value) return "status-error";
  if (activeServer.value?.status === "connected") return "status-connected";
  return "status-disconnected";
};

// 获取状态图标
const getStatusIcon = () => {
  if (syncing.value) return Loading;
  if (errorMessage.value) return Warning;
  if (activeServer.value?.status === "connected") return Grid;
  return Warning;
};

// 获取状态文本
const getStatusText = () => {
  if (syncing.value) return "正在同步...";
  if (errorMessage.value) return "同步失败";
  if (activeServer.value?.status === "connected") return "已连接";
  return "未连接";
};

// 获取服务器状态类型
const getServerStatusType = (status) => {
  const typeMap = {
    connected: "success",
    disconnected: "info",
    error: "danger",
    syncing: "warning",
  };
  return typeMap[status] || "info";
};

// 获取服务器状态文本
const getServerStatusText = (status) => {
  const textMap = {
    connected: "已连接",
    disconnected: "未连接",
    error: "连接错误",
    syncing: "同步中",
  };
  return textMap[status] || "未知";
};

// 获取同步间隔文本
const getSyncIntervalText = (interval) => {
  const textMap = {
    realtime: "实时",
    "5min": "5分钟",
    "15min": "15分钟",
    "30min": "30分钟",
    "1hour": "1小时",
  };
  return textMap[interval] || "未知";
};

// 格式化时间
const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;

  if (diff < 60000) {
    // 1分钟内
    return "刚刚";
  } else if (diff < 3600000) {
    // 1小时内
    return `${Math.floor(diff / 60000)}分钟前`;
  } else if (diff < 86400000) {
    // 1天内
    return `${Math.floor(diff / 3600000)}小时前`;
  } else {
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  }
};

// 手动同步
const manualSync = async () => {
  if (!activeServer.value) {
    ElMessage.warning("请先配置云服务器");
    return;
  }

  try {
    syncing.value = true;
    errorMessage.value = "";

    await syncServer(activeServer.value.id);

    lastSyncTime.value = Date.now();
    syncStats.value.totalSyncs++;
    syncStats.value.successfulSyncs++;

    ElMessage.success("同步完成");
    emit("syncComplete");
  } catch (error) {
    errorMessage.value = error.message;
    syncStats.value.totalSyncs++;
    syncStats.value.failedSyncs++;

    ElMessage.error("同步失败: " + error.message);
    emit("syncError", error);
  } finally {
    syncing.value = false;
  }
};

// 重试同步
const retrySync = async () => {
  retrying.value = true;
  errorMessage.value = "";

  try {
    await manualSync();
  } finally {
    retrying.value = false;
  }
};

// 更新同步进度
const updateSyncProgress = (progress) => {
  syncProgress.value = {
    show: true,
    message: progress.message || "同步中...",
    current: progress.current || 0,
    total: progress.total || 0,
    percentage:
      progress.total > 0
        ? Math.round((progress.current / progress.total) * 100)
        : 0,
    status: "success",
  };
};

// 隐藏同步进度
const hideSyncProgress = () => {
  syncProgress.value.show = false;
};

// 加载同步统计
const loadSyncStats = () => {
  try {
    const stats = localStorage.getItem("sync_stats");
    if (stats) {
      syncStats.value = JSON.parse(stats);
    }
  } catch (error) {
    console.error("加载同步统计失败:", error);
  }
};

// 保存同步统计
const saveSyncStats = () => {
  try {
    localStorage.setItem("sync_stats", JSON.stringify(syncStats.value));
  } catch (error) {
    console.error("保存同步统计失败:", error);
  }
};

// 加载最后同步时间
const loadLastSyncTime = () => {
  try {
    const time = localStorage.getItem("last_sync_time");
    if (time) {
      lastSyncTime.value = parseInt(time);
    }
  } catch (error) {
    console.error("加载最后同步时间失败:", error);
  }
};

// 保存最后同步时间
const saveLastSyncTime = () => {
  try {
    if (lastSyncTime.value) {
      localStorage.setItem("last_sync_time", lastSyncTime.value.toString());
    }
  } catch (error) {
    console.error("保存最后同步时间失败:", error);
  }
};

// 监听同步统计变化
const watchSyncStats = () => {
  // 这里可以添加对同步统计变化的监听
};

onMounted(() => {
  loadSyncStats();
  loadLastSyncTime();
  watchSyncStats();
});

onUnmounted(() => {
  saveSyncStats();
  saveLastSyncTime();
});

// 暴露方法给父组件
defineExpose({
  manualSync,
  updateSyncProgress,
  hideSyncProgress,
});
</script>

<style scoped>
.sync-status-monitor {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 320px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 16px;
  z-index: 1000;
  border: 1px solid #e0e0e0;
}

.sync-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 14px;
}

.status-syncing {
  background: rgba(64, 158, 255, 0.1);
  color: #409eff;
}

.status-connected {
  background: rgba(103, 194, 58, 0.1);
  color: #67c23a;
}

.status-error {
  background: rgba(245, 108, 108, 0.1);
  color: #f56c6c;
}

.status-disconnected {
  background: rgba(144, 147, 153, 0.1);
  color: #909399;
}

.status-icon {
  font-size: 16px;
}

.status-text {
  font-weight: 500;
}

.last-sync {
  margin-left: auto;
  font-size: 12px;
  color: #666;
}

.sync-progress {
  margin-bottom: 12px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 12px;
  color: #666;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(245, 108, 108, 0.1);
  border-radius: 6px;
  margin-bottom: 12px;
  font-size: 12px;
  color: #f56c6c;
}

.error-icon {
  font-size: 14px;
}

.quick-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.sync-details {
  border-top: 1px solid #e0e0e0;
  padding-top: 12px;
}

.detail-section {
  margin-bottom: 16px;
}

.detail-section h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #333;
  font-weight: 600;
}

.server-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.server-name {
  font-weight: 500;
  color: #333;
}

.server-url {
  font-size: 12px;
  color: #666;
  font-family: monospace;
}

.no-server {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #f56c6c;
  font-size: 12px;
}

.sync-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.stat-label {
  color: #666;
}

.stat-value {
  font-weight: 500;
  color: #333;
}

.stat-value.success {
  color: #67c23a;
}

.stat-value.error {
  color: #f56c6c;
}

.auto-sync-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sync-interval {
  font-size: 12px;
  color: #666;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sync-status-monitor {
    position: relative;
    top: auto;
    right: auto;
    width: 100%;
    margin: 16px;
  }
}
</style>
