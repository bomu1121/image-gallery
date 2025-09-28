<template>
  <CustomModal
    :visible="visible"
    title="编辑分组"
    position="center"
    width="500px"
    height="auto"
    show-footer
    confirm-text="保存"
    cancel-text="取消"
    @update:visible="$emit('update:visible', $event)"
    @confirm="handleConfirm"
    @cancel="handleCancel"
  >
    <div class="edit-group-content">
      <div class="form-group">
        <label class="form-label">分组名称</label>
        <el-input
          v-model="formData.name"
          placeholder="请输入分组名称"
          @keyup.enter="handleConfirm"
          @keyup.escape="handleCancel"
          ref="nameInput"
        />
      </div>

      <div class="form-group">
        <label class="form-label">分组描述</label>
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="3"
          placeholder="请输入分组描述（可选）"
          @keyup.escape="handleCancel"
        />
      </div>

      <div class="danger-zone">
        <div class="danger-zone-title">危险操作</div>
        <div class="danger-zone-content">
          <el-button
            type="danger"
            plain
            @click="handleDelete"
            :disabled="!canDelete"
          >
            删除分组
          </el-button>
          <div v-if="!canDelete" class="delete-tip">无法删除包含图片的分组</div>
        </div>
      </div>
    </div>
  </CustomModal>
</template>

<script setup>
import { ref, watch, nextTick, computed } from "vue";
import { ElInput, ElButton } from "element-plus";
import CustomModal from "./CustomModal.vue";

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  groupData: {
    type: Object,
    default: () => ({ id: null, name: "", description: "", imageCount: 0 }),
  },
});

// Emits
const emit = defineEmits(["update:visible", "confirm", "delete", "cancel"]);

// 表单数据
const formData = ref({
  id: null,
  name: "",
  description: "",
});

// 输入框引用
const nameInput = ref(null);

// 是否可以删除
const canDelete = computed(() => {
  return props.groupData.imageCount === 0 && props.groupData.id !== 0;
});

// 监听visible变化，重置表单数据
watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      formData.value = {
        id: props.groupData.id,
        name: props.groupData.name || "",
        description: props.groupData.description || "",
      };
      // 聚焦到名称输入框
      nextTick(() => {
        if (nameInput.value) {
          nameInput.value.focus();
          nameInput.value.select(); // 选中所有文本
        }
      });
    }
  }
);

// 处理确认
const handleConfirm = () => {
  if (!formData.value.name.trim()) {
    return; // 让父组件处理验证
  }

  emit("confirm", {
    id: formData.value.id,
    name: formData.value.name.trim(),
    description: formData.value.description.trim(),
  });
  emit("update:visible", false);
};

// 处理删除
const handleDelete = () => {
  emit("delete", formData.value.id);
  emit("update:visible", false);
};

// 处理取消
const handleCancel = () => {
  emit("cancel");
  emit("update:visible", false);
};
</script>

<style scoped>
.edit-group-content {
  padding: 8px 0;
}

.form-group {
  margin-bottom: 20px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #2c3e50;
  font-size: 14px;
}

/* 危险区域样式 */
.danger-zone {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.danger-zone-title {
  font-size: 14px;
  font-weight: 500;
  color: #f56c6c;
  margin-bottom: 12px;
}

.danger-zone-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.delete-tip {
  font-size: 12px;
  color: #909399;
}

/* 输入框样式优化 */
:deep(.el-input__wrapper) {
  border-radius: 8px;
  border: 1px solid #dcdfe6;
  box-shadow: none;
  transition: all 0.2s ease;
}

:deep(.el-input__wrapper:hover) {
  border-color: #c0c4cc;
}

:deep(.el-input__wrapper.is-focus) {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

:deep(.el-textarea__inner) {
  border-radius: 8px;
  border: 1px solid #dcdfe6;
  box-shadow: none;
  transition: all 0.2s ease;
  resize: vertical;
}

:deep(.el-textarea__inner:hover) {
  border-color: #c0c4cc;
}

:deep(.el-textarea__inner:focus) {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .form-group {
    margin-bottom: 16px;
  }

  .form-label {
    font-size: 13px;
    margin-bottom: 6px;
  }

  .danger-zone {
    margin-top: 20px;
    padding-top: 16px;
  }

  .danger-zone-content {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
