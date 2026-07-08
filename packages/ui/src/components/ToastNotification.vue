<script setup lang="ts">
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

defineProps<{
  notifications: Notification[];
}>();

const emit = defineEmits<{
  dismiss: [id: string];
}>();
</script>

<template>
  <div class="gallery-notification-container">
    <TransitionGroup name="notif">
      <div
        v-for="n in notifications"
        :key="n.id"
        class="gallery-notification"
        :class="`gallery-notification--${n.type}`"
      >
        <span class="gallery-notification__title">{{ n.title }}</span>
        <span class="gallery-notification__msg">{{ n.message }}</span>
        <button class="gallery-notification__close" @click="emit('dismiss', n.id)">×</button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.gallery-notification-container {
  position: fixed; top: 16px; right: 16px; z-index: 2000;
  display: flex; flex-direction: column; gap: 8px; max-width: 360px;
}
.gallery-notification {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 16px; background: #fff; border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.12); font-size: 13px;
}
.gallery-notification--success { border-left: 3px solid #67c23a; }
.gallery-notification--error { border-left: 3px solid #f56c6c; }
.gallery-notification--warning { border-left: 3px solid #e6a23c; }
.gallery-notification--info { border-left: 3px solid #409eff; }
.gallery-notification__title { font-weight: 600; white-space: nowrap; }
.gallery-notification__msg { flex: 1; color: #666; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.gallery-notification__close {
  border: none; background: none; font-size: 18px; cursor: pointer; color: #999;
}
.notif-enter-active, .notif-leave-active { transition: all 0.3s ease; }
.notif-enter-from, .notif-leave-to { opacity: 0; transform: translateX(30px); }
</style>
