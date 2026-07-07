<template>
  <div class="notification-container">
    <DrawerNotification
      v-for="notification in notifications"
      :key="notification.id"
      :visible="notification.visible"
      :type="notification.type"
      :title="notification.title"
      :message="notification.message"
      :detail="notification.detail"
      :duration="notification.duration"
      :closable="notification.closable"
      :show-progress="notification.showProgress"
      :progress="notification.progress"
      @close="closeNotification(notification.id)"
    />
  </div>
</template>

<script setup>
import { useDrawerNotification } from '@/composables/useDrawerNotification.js'
import DrawerNotification from './DrawerNotification.vue'

const { notifications, closeNotification } = useDrawerNotification()
</script>

<style scoped>
.notification-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9999;
}

.notification-container > * {
  pointer-events: auto;
}
</style>
