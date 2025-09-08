<template>
  <div class="groups-page">
    <!-- 分组标签栏 -->
    <div class="groups-tabs">
      <!-- 新建分组按钮 -->
      <div
        class="group-tab create-group-tab"
        @click="$emit('showCreateGroup')"
      >
        <el-icon><icon-plus /></el-icon>
      </div>

      <!-- 分组标签 -->
      <div
        v-for="group in groups"
        :key="group.id"
        class="group-tab"
        :class="{ active: currentGroupId === group.id }"
        @click="$emit('selectGroup', group.id)"
        @contextmenu.prevent="$emit('showGroupContextMenu', $event, group)"
      >
        <span class="group-name">{{ group.name }}</span>
        <span class="group-count">({{ group.imageCount }})</span>
      </div>
    </div>

    <!-- 图片展示区域 - 使用ImageGallery组件 -->
    <div class="groups-content">
      <ImageGallery
        :groups="groups"
        :selected-group-id="currentGroupId"
        :show-group-selector="false"
        :batch-delete-mode="false"
        :selected-images="new Set()"
        @go-to-detail="$emit('goToDetail', $event)"
        @show-image-context-menu="$emit('showImageContextMenu', $event, $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { Plus as IconPlus } from "@element-plus/icons-vue";
import ImageGallery from "@/views/ImageGallery.vue";

defineProps({
  groups: {
    type: Array,
    required: true
  },
  currentGroupId: {
    type: Number,
    required: true
  }
});

defineEmits([
  'showCreateGroup',
  'selectGroup', 
  'showGroupContextMenu',
  'goToDetail',
  'showImageContextMenu'
]);
</script>

<style scoped>
.groups-page {
  padding: 24px;
  height: 100%;
  overflow-y: auto;
}

.groups-tabs {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.group-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.group-tab:hover {
  background: #e8f4fd;
  border-color: #409eff;
}

.group-tab.active {
  background: #409eff;
  border-color: #409eff;
  color: white;
}

.group-tab.create-group-tab {
  background: #67c23a;
  border-color: #67c23a;
  color: white;
  min-width: 40px;
  justify-content: center;
}

.group-tab.create-group-tab:hover {
  background: #85ce61;
  border-color: #85ce61;
}

.group-name {
  font-weight: 500;
}

.group-count {
  font-size: 12px;
  opacity: 0.8;
}

.groups-content {
  flex: 1;
  padding: 0;
}
</style>
