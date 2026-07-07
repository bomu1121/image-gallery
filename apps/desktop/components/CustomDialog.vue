<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="custom-dialog-overlay"
      @click="handleOverlayClick"
    >
      <div class="custom-dialog" @click.stop>
        <!-- 对话框头部 -->
        <div class="dialog-header">
          <div class="dialog-icon">
            <el-icon v-if="type === 'warning'" class="warning-icon">
              <Warning />
            </el-icon>
            <el-icon v-else-if="type === 'error'" class="error-icon">
              <CircleClose />
            </el-icon>
            <el-icon v-else-if="type === 'success'" class="success-icon">
              <CircleCheck />
            </el-icon>
            <el-icon v-else class="info-icon">
              <InfoFilled />
            </el-icon>
          </div>
          <h3 class="dialog-title">{{ title }}</h3>
        </div>

        <!-- 对话框内容 -->
        <div class="dialog-content">
          <p v-if="message" class="dialog-message">{{ message }}</p>
          <div v-if="$slots.default" class="dialog-slot-content">
            <slot></slot>
          </div>
        </div>

        <!-- 对话框底部 -->
        <div class="dialog-footer">
          <el-button
            v-if="showCancelButton"
            @click="handleCancel"
            :class="{ 'danger-button': type === 'error' }"
          >
            {{ cancelButtonText }}
          </el-button>
          <el-button
            type="primary"
            @click="handleConfirm"
            :class="{ 'danger-button': type === 'error' }"
          >
            {{ confirmButtonText }}
          </el-button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { watch } from "vue";
import {
  Warning,
  CircleClose,
  CircleCheck,
  InfoFilled,
} from "@element-plus/icons-vue";

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: "提示",
  },
  message: {
    type: String,
    default: "",
  },
  type: {
    type: String,
    default: "info",
    validator: (value) =>
      ["info", "warning", "error", "success"].includes(value),
  },
  showCancelButton: {
    type: Boolean,
    default: true,
  },
  confirmButtonText: {
    type: String,
    default: "确定",
  },
  cancelButtonText: {
    type: String,
    default: "取消",
  },
  closeOnClickOverlay: {
    type: Boolean,
    default: false,
  },
});

// Emits
const emit = defineEmits(["update:visible", "confirm", "cancel", "close"]);

// 处理确认
const handleConfirm = () => {
  emit("confirm");
  emit("update:visible", false);
};

// 处理取消
const handleCancel = () => {
  emit("cancel");
  emit("update:visible", false);
};

// 处理关闭
const handleClose = () => {
  emit("close");
  emit("update:visible", false);
};

// 处理遮罩点击
const handleOverlayClick = () => {
  if (props.closeOnClickOverlay) {
    handleClose();
  }
};

// 监听visible变化
watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      // 显示时不禁用滚动
      document.body.style.overflow = "auto";
    }
  }
);
</script>

<style scoped>
.custom-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  /* 无背景遮罩，完全透明 */
  background: transparent;
  /* 允许点击穿透到背景 */
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.custom-dialog {
  /* 恢复指针事件 */
  pointer-events: auto;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.2);
  min-width: 400px;
  max-width: 500px;
  animation: dialogScaleIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 头部样式 */
.dialog-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px 24px 16px;
}

.dialog-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  flex-shrink: 0;
}

.info-icon {
  color: #409eff;
  background: rgba(64, 158, 255, 0.1);
  font-size: 20px;
}

.warning-icon {
  color: #e6a23c;
  background: rgba(230, 162, 60, 0.1);
  font-size: 20px;
}

.error-icon {
  color: #f56c6c;
  background: rgba(245, 108, 108, 0.1);
  font-size: 20px;
}

.success-icon {
  color: #67c23a;
  background: rgba(103, 194, 58, 0.1);
  font-size: 20px;
}

.dialog-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
}

/* 内容区域 */
.dialog-content {
  padding: 0 24px 24px;
}

.dialog-message {
  margin: 0 0 16px 0;
  color: #606266;
  line-height: 1.5;
  font-size: 14px;
}

.dialog-slot-content {
  margin-bottom: 16px;
}

/* 底部样式 */
.dialog-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 16px 24px 24px;
}

/* 危险按钮样式 */
.danger-button {
  background: #f56c6c !important;
  border-color: #f56c6c !important;
}

.danger-button:hover {
  background: #f78989 !important;
  border-color: #f78989 !important;
}

/* 动画效果 */
@keyframes dialogScaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .custom-dialog {
    min-width: 320px;
    max-width: 90vw;
    margin: 20px;
  }

  .dialog-header {
    padding: 20px 20px 12px;
  }

  .dialog-content {
    padding: 0 20px 20px;
  }

  .dialog-footer {
    padding: 12px 20px 20px;
    flex-direction: column-reverse;
  }

  .dialog-footer .el-button {
    width: 100%;
  }
}
</style>
