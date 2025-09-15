<template>
  <div class="cloud-sync-settings">
    <!-- 云服务器配置列表 -->
    <div class="servers-section">
      <div class="section-header">
        <h4>云服务器配置</h4>
        <el-button type="primary" @click="showAddDialog = true">
          <el-icon><Plus /></el-icon>
          添加服务器
        </el-button>
      </div>

      <div class="servers-list">
        <div
          v-for="server in cloudServers"
          :key="server.id"
          class="server-item"
          :class="{ active: server.id === activeServerId }"
        >
          <div class="server-info">
            <div class="server-name">
              <el-icon class="server-icon">
                <component :is="getServerIcon(server.type)" />
              </el-icon>
              <span>{{ server.name }}</span>
              <el-tag
                v-if="server.id === activeServerId"
                type="success"
                size="small"
                class="active-tag"
              >
                当前使用
              </el-tag>
            </div>
            <div class="server-details">
              <span class="server-url">{{ server.baseUrl }}</span>
              <span
                class="server-status"
                :class="getStatusClass(server.status)"
              >
                {{ getStatusText(server.status) }}
              </span>
            </div>
          </div>
          <div class="server-actions">
            <el-button
              v-if="server.id !== activeServerId"
              type="primary"
              size="small"
              @click="setActiveServer(server.id)"
            >
              使用
            </el-button>
            <el-button
              type="success"
              size="small"
              :loading="server.syncing"
              @click="syncServer(server.id)"
            >
              {{ server.syncing ? "同步中" : "同步" }}
            </el-button>
            <el-button type="warning" size="small" @click="editServer(server)">
              编辑
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click="deleteServer(server.id)"
            >
              删除
            </el-button>
          </div>
        </div>

        <div v-if="cloudServers.length === 0" class="empty-servers">
          <el-icon class="empty-icon"><Upload /></el-icon>
          <p>暂无云服务器配置</p>
          <p class="empty-desc">添加云服务器以实现数据同步功能</p>
        </div>
      </div>
    </div>

    <!-- 同步设置 -->
    <div class="sync-settings-section">
      <div class="section-header">
        <h4>同步设置</h4>
      </div>

      <div class="sync-options">
        <el-form :model="syncSettings" label-width="120px">
          <el-form-item label="自动同步">
            <el-switch
              v-model="syncSettings.autoSync"
              @change="updateSyncSettings"
            />
            <span class="form-tip">启用后将在数据变更时自动同步到云服务器</span>
          </el-form-item>

          <el-form-item label="同步间隔">
            <el-select
              v-model="syncSettings.syncInterval"
              @change="updateSyncSettings"
              :disabled="!syncSettings.autoSync"
            >
              <el-option label="实时同步" value="realtime" />
              <el-option label="5分钟" value="5min" />
              <el-option label="15分钟" value="15min" />
              <el-option label="30分钟" value="30min" />
              <el-option label="1小时" value="1hour" />
            </el-select>
          </el-form-item>

          <el-form-item label="冲突处理">
            <el-select
              v-model="syncSettings.conflictResolution"
              @change="updateSyncSettings"
            >
              <el-option label="本地优先" value="local" />
              <el-option label="云端优先" value="remote" />
              <el-option label="询问用户" value="ask" />
            </el-select>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <!-- 添加/编辑服务器对话框 -->
    <el-dialog
      v-model="showAddDialog"
      :title="editingServer ? '编辑服务器' : '添加服务器'"
      width="600px"
      @close="resetForm"
    >
      <el-form
        ref="serverFormRef"
        :model="serverForm"
        :rules="serverFormRules"
        label-width="100px"
      >
        <el-form-item label="服务器名称" prop="name">
          <el-input v-model="serverForm.name" placeholder="请输入服务器名称" />
        </el-form-item>

        <el-form-item label="服务器类型" prop="type">
          <el-select v-model="serverForm.type" placeholder="选择服务器类型">
            <el-option label="WebDAV" value="webdav" />
            <el-option label="FTP" value="ftp" />
            <el-option label="SFTP" value="sftp" />
            <el-option label="HTTP API" value="http" />
            <el-option label="本地NAS" value="nas" />
            <el-option label="路由器存储" value="router" />
            <el-option label="免费云存储" value="free-cloud" />
            <el-option label="自定义" value="custom" />
          </el-select>
        </el-form-item>

        <el-form-item label="服务器地址" prop="baseUrl">
          <el-input
            v-model="serverForm.baseUrl"
            placeholder="例如: https://example.com/webdav"
          />
        </el-form-item>

        <el-form-item label="用户名" prop="username">
          <el-input v-model="serverForm.username" placeholder="请输入用户名" />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="serverForm.password"
            type="password"
            placeholder="请输入密码"
            show-password
          />
        </el-form-item>

        <el-form-item label="存储路径" prop="path">
          <el-input v-model="serverForm.path" placeholder="例如: /images" />
        </el-form-item>

        <el-form-item label="连接测试">
          <el-button
            type="info"
            :loading="testingConnection"
            @click="testConnection"
          >
            {{ testingConnection ? "测试中..." : "测试连接" }}
          </el-button>
          <span v-if="connectionTestResult" class="test-result">
            {{ connectionTestResult }}
          </span>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveServer">
          {{ saving ? "保存中..." : "保存" }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Plus,
  Upload,
  Setting,
  Grid,
  Warning,
  Loading,
} from "@element-plus/icons-vue";
import { useCloudSync } from "../composables/useCloudSync";

const emit = defineEmits(["syncStatusChange"]);

// 使用云同步组合式函数
const {
  cloudServers,
  activeServerId,
  syncSettings,
  addServer,
  updateServer,
  deleteServer: removeServer,
  setActiveServer: switchActiveServer,
  syncServer: performSync,
  updateSyncSettings: updateSettings,
  testServerConnection,
} = useCloudSync();

// 对话框状态
const showAddDialog = ref(false);
const editingServer = ref(null);
const saving = ref(false);
const testingConnection = ref(false);
const connectionTestResult = ref("");

// 服务器表单
const serverFormRef = ref();
const serverForm = reactive({
  name: "",
  type: "webdav",
  baseUrl: "",
  username: "",
  password: "",
  path: "/images",
});

// 表单验证规则
const serverFormRules = {
  name: [{ required: true, message: "请输入服务器名称", trigger: "blur" }],
  type: [{ required: true, message: "请选择服务器类型", trigger: "change" }],
  baseUrl: [
    { required: true, message: "请输入服务器地址", trigger: "blur" },
    { type: "url", message: "请输入有效的URL地址", trigger: "blur" },
  ],
  username: [{ required: true, message: "请输入用户名", trigger: "blur" }],
  password: [{ required: true, message: "请输入密码", trigger: "blur" }],
};

// 获取服务器图标
const getServerIcon = (type) => {
  const iconMap = {
    webdav: Grid,
    ftp: Upload,
    sftp: Upload,
    http: Grid,
    nas: Setting,
    router: Setting,
    'free-cloud': Upload,
    custom: Setting,
  };
  return iconMap[type] || Setting;
};

// 获取状态样式类
const getStatusClass = (status) => {
  const classMap = {
    connected: "status-connected",
    disconnected: "status-disconnected",
    error: "status-error",
    syncing: "status-syncing",
  };
  return classMap[status] || "status-unknown";
};

// 获取状态文本
const getStatusText = (status) => {
  const textMap = {
    connected: "已连接",
    disconnected: "未连接",
    error: "连接错误",
    syncing: "同步中",
  };
  return textMap[status] || "未知";
};

// 设置活动服务器
const setActiveServer = async (serverId) => {
  try {
    await switchActiveServer(serverId);
    ElMessage.success("已切换到新的云服务器");
  } catch (error) {
    ElMessage.error("切换服务器失败: " + error.message);
  }
};

// 同步服务器
const syncServer = async (serverId) => {
  try {
    await performSync(serverId);
    ElMessage.success("同步完成");
  } catch (error) {
    ElMessage.error("同步失败: " + error.message);
  }
};

// 编辑服务器
const editServer = (server) => {
  editingServer.value = server;
  Object.assign(serverForm, server);
  showAddDialog.value = true;
};

// 删除服务器
const deleteServer = async (serverId) => {
  try {
    await ElMessageBox.confirm("确定要删除这个云服务器配置吗？", "确认删除", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });

    await removeServer(serverId);
    ElMessage.success("服务器配置已删除");
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("删除失败: " + error.message);
    }
  }
};

// 测试连接
const testConnection = async () => {
  if (!serverFormRef.value) return;

  try {
    await serverFormRef.value.validate([
      "name",
      "type",
      "baseUrl",
      "username",
      "password",
    ]);

    testingConnection.value = true;
    connectionTestResult.value = "";

    const result = await testServerConnection(serverForm);

    if (result.success) {
      connectionTestResult.value = "连接成功！";
      ElMessage.success("连接测试成功");
    } else {
      connectionTestResult.value = `连接失败: ${result.error}`;
      ElMessage.error("连接测试失败");
    }
  } catch (error) {
    connectionTestResult.value = `连接失败: ${error.message}`;
    ElMessage.error("连接测试失败");
  } finally {
    testingConnection.value = false;
  }
};

// 保存服务器
const saveServer = async () => {
  if (!serverFormRef.value) return;

  try {
    await serverFormRef.value.validate();

    saving.value = true;

    if (editingServer.value) {
      await updateServer(editingServer.value.id, serverForm);
      ElMessage.success("服务器配置已更新");
    } else {
      await addServer(serverForm);
      ElMessage.success("服务器配置已添加");
    }

    showAddDialog.value = false;
  } catch (error) {
    ElMessage.error("保存失败: " + error.message);
  } finally {
    saving.value = false;
  }
};

// 重置表单
const resetForm = () => {
  editingServer.value = null;
  connectionTestResult.value = "";
  Object.assign(serverForm, {
    name: "",
    type: "webdav",
    baseUrl: "",
    username: "",
    password: "",
    path: "/images",
  });
  if (serverFormRef.value) {
    serverFormRef.value.resetFields();
  }
};

// 更新同步设置
const updateSyncSettings = async () => {
  try {
    await updateSettings(syncSettings.value);
    ElMessage.success("同步设置已更新");
  } catch (error) {
    ElMessage.error("更新同步设置失败: " + error.message);
  }
};

onMounted(() => {
  // 组件挂载时的初始化逻辑
});
</script>

<style scoped>
.cloud-sync-settings {
  padding: 0;
}

.servers-section,
.sync-settings-section {
  margin-bottom: 32px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e0e0e0;
}

.section-header h4 {
  margin: 0;
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

.servers-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.server-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  transition: all 0.2s ease;
}

.server-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.server-item.active {
  border-color: #67c23a;
  background: rgba(103, 194, 58, 0.05);
}

.server-info {
  flex: 1;
}

.server-name {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.server-icon {
  font-size: 16px;
  color: #666;
}

.server-name span {
  font-weight: 500;
  color: #333;
}

.active-tag {
  margin-left: 8px;
}

.server-details {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 12px;
  color: #666;
}

.server-url {
  font-family: monospace;
}

.server-status {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.status-connected {
  background: rgba(103, 194, 58, 0.1);
  color: #67c23a;
}

.status-disconnected {
  background: rgba(144, 147, 153, 0.1);
  color: #909399;
}

.status-error {
  background: rgba(245, 108, 108, 0.1);
  color: #f56c6c;
}

.status-syncing {
  background: rgba(64, 158, 255, 0.1);
  color: #409eff;
}

.server-actions {
  display: flex;
  gap: 8px;
}

.empty-servers {
  text-align: center;
  padding: 48px 24px;
  color: #999;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-servers p {
  margin: 8px 0;
  font-size: 16px;
}

.empty-desc {
  font-size: 14px;
  color: #ccc;
}

.sync-options {
  background: white;
  padding: 24px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.form-tip {
  margin-left: 12px;
  font-size: 12px;
  color: #666;
}

.test-result {
  margin-left: 12px;
  font-size: 12px;
  color: #67c23a;
}

.test-result.error {
  color: #f56c6c;
}
</style>
