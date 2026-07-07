<template>
  <CustomModal
    :visible="visible"
    title="新建分组"
    position="center"
    width="500px"
    height="auto"
    show-footer
    confirm-text="确定"
    cancel-text="取消"
    @update:visible="$emit('update:visible', $event)"
    @confirm="handleConfirm"
    @cancel="handleCancel"
  >
    <div class="create-group-content">
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
    </div>
  </CustomModal>
</template>

<script setup>
import { ref, watch, nextTick } from "vue";
import { ElInput } from "element-plus";
import CustomModal from "./CustomModal.vue";

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  initialData: {
    type: Object,
    default: () => ({ name: "", description: "" }),
  },
});

// Emits
const emit = defineEmits(["update:visible", "confirm", "cancel"]);

// 表单数据
const formData = ref({
  name: "",
  description: "",
});

// 输入框引用
const nameInput = ref(null);

// 监听visible变化，重置表单数据
watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      formData.value = {
        name: props.initialData.name || "",
        description: props.initialData.description || "",
      };
      // 聚焦到名称输入框
      nextTick(() => {
        if (nameInput.value) {
          nameInput.value.focus();
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
    name: formData.value.name.trim(),
    description: formData.value.description.trim(),
  });
  emit("update:visible", false);
};

// 处理取消
const handleCancel = () => {
  emit("cancel");
  emit("update:visible", false);
};
</script>

<style scoped>
.create-group-content {
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
}
</style>
