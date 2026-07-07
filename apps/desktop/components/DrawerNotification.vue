<template>
  <Transition name="drawer-slide">
    <div
      v-if="visible"
      class="drawer-notification"
      :class="`drawer-notification--${type}`"
    >
      <div class="drawer-notification__content">
        <div class="drawer-notification__icon">
          <el-icon class="icon">
            <component :is="iconComponent" />
          </el-icon>
        </div>

        <div class="drawer-notification__body">
          <div class="drawer-notification__title" v-if="title">{{ title }}</div>
          <div class="drawer-notification__message">{{ message }}</div>
          <div class="drawer-notification__detail" v-if="detail">
            {{ detail }}
          </div>
        </div>
      </div>

      <!-- 进度条 -->
      <div v-if="showProgress" class="drawer-notification__progress">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import {
  SuccessFilled,
  CircleCloseFilled,
  WarningFilled,
  InfoFilled,
} from "@element-plus/icons-vue";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  type: {
    type: String,
    default: "info",
    validator: (value) =>
      ["success", "error", "warning", "info"].includes(value),
  },
  title: {
    type: String,
    default: "",
  },
  message: {
    type: String,
    default: "",
  },
  detail: {
    type: String,
    default: "",
  },
  duration: {
    type: Number,
    default: 0, // 0表示不自动关闭
  },
  showProgress: {
    type: Boolean,
    default: false,
  },
  progress: {
    type: Number,
    default: 0,
  },
});

const emit = defineEmits(["close"]);

// 图标映射
const iconMap = {
  success: SuccessFilled,
  error: CircleCloseFilled,
  warning: WarningFilled,
  info: InfoFilled,
};

const iconComponent = computed(() => iconMap[props.type]);

let timer = null;

// 自动关闭
onMounted(() => {
  if (props.duration > 0) {
    timer = setTimeout(() => {
      emit("close");
    }, props.duration);
  }
});

onUnmounted(() => {
  if (timer) {
    clearTimeout(timer);
  }
});
</script>

<style scoped>
.drawer-notification {
  position: fixed;
  bottom: 0;
  right: 0;
  width: 380px;
  max-width: calc(100vw - 20px);
  background: white;
  border: 1px solid #e5e7eb;
  border-right: none;
  border-bottom: none;
  overflow: hidden;
  z-index: 9999;
  transform-origin: right bottom;
}

.drawer-notification__content {
  display: flex;
  align-items: flex-start;
  padding: 16px;
  gap: 12px;
}

.drawer-notification__icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.drawer-notification__icon .icon {
  font-size: 16px;
}

.drawer-notification__body {
  flex: 1;
  min-width: 0;
}

.drawer-notification__title {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
  line-height: 1.4;
}

.drawer-notification__message {
  font-size: 14px;
  color: #374151;
  line-height: 1.5;
  margin-bottom: 4px;
}

.drawer-notification__detail {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.4;
}

.drawer-notification__progress {
  height: 3px;
  background: #f3f4f6;
}

.progress-bar {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #3b82f6;
  transition: width 0.3s ease;
}

/* 不同类型样式 */
.drawer-notification--success {
  border-left: 4px solid #10b981;
}

.drawer-notification--success .drawer-notification__icon {
  background: #d1fae5;
  color: #10b981;
}

.drawer-notification--success .progress-fill {
  background: #10b981;
}

.drawer-notification--error {
  border-left: 4px solid #ef4444;
}

.drawer-notification--error .drawer-notification__icon {
  background: #fee2e2;
  color: #ef4444;
}

.drawer-notification--error .progress-fill {
  background: #ef4444;
}

.drawer-notification--warning {
  border-left: 4px solid #f59e0b;
}

.drawer-notification--warning .drawer-notification__icon {
  background: #fef3c7;
  color: #f59e0b;
}

.drawer-notification--warning .progress-fill {
  background: #f59e0b;
}

.drawer-notification--info {
  border-left: 4px solid #3b82f6;
}

.drawer-notification--info .drawer-notification__icon {
  background: #dbeafe;
  color: #3b82f6;
}

.drawer-notification--info .progress-fill {
  background: #3b82f6;
}

/* 抽屉动画 */
.drawer-slide-enter-active {
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.drawer-slide-leave-active {
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.drawer-slide-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.drawer-slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.drawer-slide-enter-to,
.drawer-slide-leave-from {
  transform: translateX(0);
  opacity: 1;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .drawer-notification {
    width: calc(100vw - 10px);
    right: 0;
    bottom: 0;
  }

  .drawer-notification__content {
    padding: 12px;
  }

  .drawer-notification__title {
    font-size: 13px;
  }

  .drawer-notification__message {
    font-size: 13px;
  }
}
</style>
