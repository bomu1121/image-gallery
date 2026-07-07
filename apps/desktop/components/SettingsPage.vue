<template>
  <div class="settings-page">
    <!-- 左侧设置项列表 -->
    <div class="settings-sidebar">
      <!-- <div class="settings-header">
        <h2>设置</h2>
      </div> -->

      <div class="settings-menu">
        <div
          v-for="item in settingsItems"
          :key="item.key"
          class="setting-menu-item"
          :class="{ active: activeSetting === item.key }"
          @click="handleMenuClick(item.key, $event)"
        >
          <el-icon class="menu-icon">
            <component :is="item.icon" />
          </el-icon>
          <span class="menu-text">{{ item.title }}</span>
          <div class="ripple-effect"></div>
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

        <!-- 个性化设置内容 -->
        <PersonalizationSettings
          v-else-if="activeSetting === 'personalization'"
          @column-count-change="$emit('columnCountChange', $event)"
        />

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
import {
  Picture,
  Setting,
  Upload,
  Download,
  Star,
  User,
} from "@/utils/icons.js";
import BackgroundSettingsContent from "./BackgroundSettingsContent.vue";
import CloudSyncSettings from "./CloudSyncSettings.vue";
import ImportExportSettings from "./ImportExportSettings.vue";
import AISettings from "./AISettings.vue";
import PersonalizationSettings from "./PersonalizationSettings.vue";

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
  "columnCountChange",
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
  {
    key: "personalization",
    title: "个性化",
    description: "自定义应用界面和展示方式",
    icon: User,
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

// 处理菜单点击事件，添加波纹动效
const handleMenuClick = (key, event) => {
  activeSetting.value = key;

  // 创建波纹效果
  const button = event.currentTarget;
  const ripple = button.querySelector(".ripple-effect");

  // 获取点击位置
  const rect = button.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = event.clientX - rect.left + 20; // 向右偏移20px
  const y = event.clientY - rect.top;

  // 设置波纹位置和大小
  ripple.style.width = ripple.style.height = size + "px";
  ripple.style.left = x - size / 2 + "px";
  ripple.style.top = y - size / 2 + "px";
  ripple.style.transform = "translate(-50%, -50%) scale(0)";

  // 移除之前的动画类
  ripple.classList.remove("animate");

  // 强制重排，然后添加动画类
  ripple.offsetHeight;
  ripple.classList.add("animate");

  // 动画结束后移除动画类
  setTimeout(() => {
    ripple.classList.remove("animate");
  }, 600);
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
  width: 200px;
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
  /* padding: 16px 0; */
}

.setting-menu-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  margin: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #666;
  border-radius: 8px;
  overflow: hidden;
}

.setting-menu-item:hover {
  background: rgba(128, 128, 128, 0.05);
}

.setting-menu-item.active {
  background: rgba(128, 128, 128, 0.1);
}

.menu-icon {
  font-size: 18px;
}

.menu-text {
  font-size: 14px;
  font-weight: 600;
}

/* 波纹动效 */
.ripple-effect {
  position: absolute;
  border-radius: 50%;
  background: rgba(128, 128, 128, 0.4);
  width: 0;
  height: 0;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%) scale(0);
  pointer-events: none;
  z-index: 1;
}

.ripple-effect.animate {
  animation: ripple 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes ripple {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
  100% {
    transform: translate(-50%, -50%) scale(2.5);
    opacity: 0;
  }
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
