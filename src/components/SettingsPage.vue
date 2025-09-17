<template>
  <div class="settings-page">
    <!-- 左侧设置项列表 -->
    <div class="settings-sidebar">
      <div class="settings-header">
        <h2>设置</h2>
      </div>

      <div class="settings-menu">
        <div
          v-for="item in settingsItems"
          :key="item.key"
          class="setting-menu-item"
          :class="{ active: activeSetting === item.key }"
          @click="activeSetting = item.key"
        >
          <el-icon class="menu-icon">
            <component :is="item.icon" />
          </el-icon>
          <span class="menu-text">{{ item.title }}</span>
        </div>
      </div>
    </div>

    <!-- 右侧设置内容区域 -->
    <div class="settings-content">
      <div class="content-header">
        <h3>{{ getCurrentSettingTitle() }}</h3>
        <p>{{ getCurrentSettingDescription() }}</p>
      </div>

      <div class="content-body">
        <!-- 背景设置内容 -->
        <BackgroundSettingsContent
          v-if="activeSetting === 'background'"
          :background-image="backgroundImage"
          :background-opacity="backgroundOpacity"
          @background-change="$emit('backgroundChange', $event)"
          @opacity-change="$emit('opacityChange', $event)"
          @remove-background="$emit('removeBackground')"
        />

        <!-- 云同步设置内容 -->
        <CloudSyncSettings
          v-else-if="activeSetting === 'cloud-sync'"
          @sync-status-change="$emit('syncStatusChange', $event)"
        />

        <!-- 导入导出设置内容 -->
        <ImportExportSettings
          v-else-if="activeSetting === 'import-export'"
          :groups="groups"
          @data-imported="$emit('dataImported', $event)"
          @data-exported="$emit('dataExported', $event)"
        />

        <!-- AI设置内容 -->
        <AISettings v-else-if="activeSetting === 'ai-config'" />

        <!-- 其他设置内容可以在这里添加 -->
        <div v-else class="empty-content">
          <el-icon class="empty-icon"><icon-setting /></el-icon>
          <p>该设置项正在开发中...</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { Picture, Setting, Upload, Download, Star } from "@/utils/icons.js";
import BackgroundSettingsContent from "./BackgroundSettingsContent.vue";
import CloudSyncSettings from "./CloudSyncSettings.vue";
import ImportExportSettings from "./ImportExportSettings.vue";
import AISettings from "./AISettings.vue";

const props = defineProps({
  backgroundImage: {
    type: String,
    default: null,
  },
  backgroundOpacity: {
    type: Number,
    default: 0.3,
  },
  groups: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits([
  "backgroundChange",
  "opacityChange",
  "removeBackground",
  "syncStatusChange",
  "dataImported",
  "dataExported",
]);

// 设置项配置
const settingsItems = [
  {
    key: "background",
    title: "背景设置",
    description: "自定义应用背景图片和透明度",
    icon: Picture,
  },
  {
    key: "cloud-sync",
    title: "云同步",
    description: "配置云服务器实现数据同步",
    icon: Upload,
  },
  {
    key: "import-export",
    title: "导入导出",
    description: "图片资源的导入和导出功能",
    icon: Download,
  },
  {
    key: "ai-config",
    title: "AI 配置",
    description: "配置 AI 服务用于图片标签分析",
    icon: Star,
  },
  // 可以在这里添加更多设置项
];

const route = useRoute();

// 当前激活的设置项
const activeSetting = ref("background");

// 根据URL参数设置激活的标签
onMounted(() => {
  if (route.query.tab) {
    const validTabs = settingsItems.map((item) => item.key);
    if (validTabs.includes(route.query.tab)) {
      activeSetting.value = route.query.tab;
    }
  }
});

// 获取当前设置项的标题
const getCurrentSettingTitle = () => {
  const item = settingsItems.find((item) => item.key === activeSetting.value);
  return item ? item.title : "";
};

// 获取当前设置项的描述
const getCurrentSettingDescription = () => {
  const item = settingsItems.find((item) => item.key === activeSetting.value);
  return item ? item.description : "";
};
</script>

<style scoped>
.settings-page {
  display: flex;
  height: 100%;
  background: #f5f5f5;
}

/* 左侧设置项列表 */
.settings-sidebar {
  width: 280px;
  background: white;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
}

.settings-header {
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
  background: #fafafa;
}

.settings-header h2 {
  margin: 0;
  color: #333;
  font-size: 20px;
  font-weight: 600;
}

.settings-menu {
  flex: 1;
  padding: 16px 0;
}

.setting-menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #666;
  border-left: 3px solid transparent;
}

.setting-menu-item:hover {
  background: rgba(64, 158, 255, 0.05);
  color: #409eff;
}

.setting-menu-item.active {
  background: rgba(64, 158, 255, 0.1);
  color: #409eff;
  border-left-color: #409eff;
  font-weight: 500;
}

.menu-icon {
  font-size: 18px;
}

.menu-text {
  font-size: 14px;
}

/* 右侧设置内容区域 */
.settings-content {
  flex: 1;
  background: white;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.content-header {
  padding: 24px 32px;
  border-bottom: 1px solid #e0e0e0;
  background: #fafafa;
}

.content-header h3 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 20px;
  font-weight: 600;
}

.content-header p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.content-body {
  flex: 1;
  padding: 32px;
  overflow-y: auto;
}

.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #999;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-content p {
  margin: 0;
  font-size: 16px;
}
</style>
