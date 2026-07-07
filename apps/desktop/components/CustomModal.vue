<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="custom-modal-overlay"
      @click="handleOverlayClick"
    >
      <div
        class="custom-modal"
        :class="[`modal-${position}`, { 'modal-fullscreen': fullscreen }]"
        @click.stop
      >
        <!-- 模态框头部 -->
        <div v-if="showHeader" class="modal-header">
          <h3 class="modal-title">{{ title }}</h3>
          <button v-if="showClose" class="modal-close" @click="handleClose">
            <el-icon><Close /></el-icon>
          </button>
        </div>

        <!-- 模态框内容 -->
        <div class="modal-content">
          <slot></slot>
        </div>

        <!-- 模态框底部 -->
        <div v-if="showFooter" class="modal-footer">
          <slot name="footer">
            <div class="modal-footer-actions">
              <el-button @click="handleCancel">{{ cancelText }}</el-button>
              <el-button type="primary" @click="handleConfirm">{{
                confirmText
              }}</el-button>
            </div>
          </slot>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch } from "vue";
import { Close } from "@element-plus/icons-vue";

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: "",
  },
  position: {
    type: String,
    default: "center", // center, top, bottom, left, right
    validator: (value) =>
      ["center", "top", "bottom", "left", "right"].includes(value),
  },
  fullscreen: {
    type: Boolean,
    default: false,
  },
  showHeader: {
    type: Boolean,
    default: true,
  },
  showFooter: {
    type: Boolean,
    default: false,
  },
  showClose: {
    type: Boolean,
    default: true,
  },
  closeOnClickOverlay: {
    type: Boolean,
    default: true,
  },
  confirmText: {
    type: String,
    default: "确定",
  },
  cancelText: {
    type: String,
    default: "取消",
  },
  width: {
    type: String,
    default: "auto",
  },
  height: {
    type: String,
    default: "auto",
  },
});

// Emits
const emit = defineEmits(["update:visible", "close", "confirm", "cancel"]);

// 处理关闭
const handleClose = () => {
  emit("update:visible", false);
  emit("close");
};

// 处理确认
const handleConfirm = () => {
  emit("confirm");
};

// 处理取消
const handleCancel = () => {
  emit("update:visible", false);
  emit("cancel");
};

// 处理遮罩点击
const handleOverlayClick = () => {
  if (props.closeOnClickOverlay) {
    handleClose();
  }
};

// 监听visible变化，控制body滚动
watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      // 显示时不禁用滚动，保持背景可滚动
      document.body.style.overflow = "auto";
    } else {
      // 隐藏时恢复滚动
      document.body.style.overflow = "auto";
    }
  }
);
</script>

<style scoped>
.custom-modal-overlay {
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
}

.custom-modal {
  /* 恢复指针事件 */
  pointer-events: auto;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.2);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 位置样式 */
.modal-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: v-bind(width);
  height: v-bind(height);
  max-width: 90vw;
  max-height: 90vh;
}

.modal-top {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: v-bind(width);
  height: v-bind(height);
  max-width: 90vw;
  max-height: calc(100vh - 40px);
}

.modal-bottom {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: v-bind(width);
  height: v-bind(height);
  max-width: 90vw;
  max-height: calc(100vh - 40px);
}

.modal-left {
  position: absolute;
  top: 50%;
  left: 20px;
  transform: translateY(-50%);
  width: v-bind(width);
  height: v-bind(height);
  max-width: calc(100vw - 40px);
  max-height: 90vh;
}

.modal-right {
  position: absolute;
  top: 50%;
  right: 20px;
  transform: translateY(-50%);
  width: v-bind(width);
  height: v-bind(height);
  max-width: calc(100vw - 40px);
  max-height: 90vh;
}

/* 全屏模式 */
.modal-fullscreen {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw !important;
  height: 100vh !important;
  max-width: none !important;
  max-height: none !important;
  transform: none !important;
  border-radius: 0;
}

/* 头部样式 */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
}

.modal-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  color: #8a9ba8;
  transition: all 0.2s ease;
}

.modal-close:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #666;
}

/* 内容区域 */
.modal-content {
  padding: 24px;
  overflow-y: auto;
  max-height: calc(90vh - 120px);
}

/* 底部样式 */
.modal-footer {
  padding: 16px 24px 20px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.modal-footer-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

/* 动画效果 */
.custom-modal-overlay {
  animation: fadeIn 0.3s ease-out;
}

.custom-modal {
  animation: modalSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-center .custom-modal {
  animation: modalScaleIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-top .custom-modal {
  animation: modalSlideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-bottom .custom-modal {
  animation: modalSlideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-left .custom-modal {
  animation: modalSlideRight 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-right .custom-modal {
  animation: modalSlideLeft 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 关键帧动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes modalScaleIn {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

@keyframes modalSlideDown {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

@keyframes modalSlideUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

@keyframes modalSlideRight {
  from {
    opacity: 0;
    transform: translateY(-50%) translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(-50%) translateX(0);
  }
}

@keyframes modalSlideLeft {
  from {
    opacity: 0;
    transform: translateY(-50%) translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateY(-50%) translateX(0);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .modal-center,
  .modal-top,
  .modal-bottom {
    left: 10px;
    right: 10px;
    transform: translateX(0);
    width: auto;
    max-width: none;
  }

  .modal-center {
    top: 50%;
    transform: translateY(-50%);
  }

  .modal-left,
  .modal-right {
    left: 10px;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    width: auto;
    max-width: none;
  }
}

/* 自定义滚动条 */
.modal-content::-webkit-scrollbar {
  width: 6px;
}

.modal-content::-webkit-scrollbar-track {
  background: transparent;
}

.modal-content::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.modal-content::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}
</style>
