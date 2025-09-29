<template>
  <CustomModal
    :visible="visible"
    title="选择分组"
    position="center"
    width="400px"
    height="auto"
    show-footer
    confirm-text="确定"
    cancel-text="取消"
    @update:visible="$emit('update:visible', $event)"
    @confirm="handleConfirm"
    @cancel="handleCancel"
  >
    <div class="select-group-content">
      <div class="group-options">
        <div
          v-for="group in groups"
          :key="group.id"
          class="group-option"
          :class="{ selected: selectedGroupId === group.id }"
          @click="selectGroup(group.id)"
        >
          <el-icon><Folder /></el-icon>
          <span class="group-name">{{ group.name }}</span>
          <span class="group-count">({{ group.imageCount }})</span>
        </div>
      </div>
    </div>
  </CustomModal>
</template>

<script setup>
import { ref, watch } from "vue";
import { ElIcon } from "element-plus";
import { Folder } from "@element-plus/icons-vue";
import CustomModal from "./CustomModal.vue";

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  groups: {
    type: Array,
    default: () => [],
  },
  selectedGroupId: {
    type: Number,
    default: 0,
  },
});

// Emits
const emit = defineEmits(["update:visible", "confirm", "cancel", "select"]);

// 内部选择状态
const internalSelectedId = ref(props.selectedGroupId);

// 监听props变化
watch(
  () => props.selectedGroupId,
  (newVal) => {
    internalSelectedId.value = newVal;
  },
  { immediate: true }
);

// 选择分组
const selectGroup = (groupId) => {
  internalSelectedId.value = groupId;
  emit("select", groupId);
};

// 处理确认
const handleConfirm = () => {
  emit("confirm", internalSelectedId.value);
  emit("update:visible", false);
};

// 处理取消
const handleCancel = () => {
  emit("cancel");
  emit("update:visible", false);
};
</script>

<style scoped>
.select-group-content {
  padding: 8px 0;
}

.group-options {
  max-height: 300px;
  overflow-y: auto;
}

.group-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 8px;
}

.group-option:hover {
  background: #f5f5f5;
  border-color: #409eff;
}

.group-option.selected {
  background: #e8f4fd;
  border-color: #409eff;
}

.group-option .el-icon {
  color: #409eff;
  font-size: 18px;
}

.group-option .group-name {
  flex: 1;
  font-weight: 500;
}

.group-option .group-count {
  font-size: 12px;
  color: #666;
}

/* 自定义滚动条 */
.group-options::-webkit-scrollbar {
  width: 6px;
}

.group-options::-webkit-scrollbar-track {
  background: transparent;
}

.group-options::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.group-options::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .group-option {
    padding: 10px;
    gap: 10px;
  }

  .group-option .el-icon {
    font-size: 16px;
  }
}
</style>
