<script setup lang="ts">
import { computed } from 'vue';

export interface DialogConfig {
  title: string;
  message: string;
  type?: 'info' | 'warning' | 'error' | 'success';
  showCancelButton?: boolean;
  confirmButtonText?: string;
  cancelButtonText?: string;
}

const props = withDefaults(defineProps<{
  visible: boolean;
  config: DialogConfig;
}>(), {
  visible: false,
  config: () => ({
    title: '',
    message: '',
    type: 'info',
    showCancelButton: true,
    confirmButtonText: 'Confirm',
    cancelButtonText: 'Cancel',
  }),
});

const emit = defineEmits<{
  confirm: [];
  cancel: [];
  'update:visible': [value: boolean];
}>();

const typeIcon = computed(() => {
  const icons: Record<string, string> = {
    info: 'ℹ',
    warning: '⚠',
    error: '✕',
    success: '✓',
  };
  return icons[props.config.type ?? 'info'] ?? 'ℹ';
});
</script>

<template>
  <div v-if="visible" class="gallery-dialog-overlay" @click.self="emit('cancel')">
    <div class="gallery-dialog" :class="`gallery-dialog--${config.type || 'info'}`">
      <div class="gallery-dialog__icon">{{ typeIcon }}</div>
      <div class="gallery-dialog__body">
        <h3 class="gallery-dialog__title">{{ config.title }}</h3>
        <p class="gallery-dialog__message">{{ config.message }}</p>
      </div>
      <div class="gallery-dialog__actions">
        <button
          v-if="config.showCancelButton"
          class="gallery-dialog__btn gallery-dialog__btn--cancel"
          @click="emit('cancel')"
        >
          {{ config.cancelButtonText }}
        </button>
        <button class="gallery-dialog__btn gallery-dialog__btn--confirm" @click="emit('confirm')">
          {{ config.confirmButtonText }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.gallery-dialog-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.45);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
}
.gallery-dialog {
  background: #fff; border-radius: 8px; padding: 24px;
  min-width: 320px; max-width: 420px; box-shadow: 0 8px 32px rgba(0,0,0,0.16);
}
.gallery-dialog__icon { font-size: 24px; margin-bottom: 12px; }
.gallery-dialog__title { margin: 0 0 8px; font-size: 16px; font-weight: 600; }
.gallery-dialog__message { margin: 0 0 20px; font-size: 14px; color: #666; }
.gallery-dialog__actions { display: flex; gap: 8px; justify-content: flex-end; }
.gallery-dialog__btn {
  padding: 8px 20px; border: 1px solid #ddd; border-radius: 6px;
  background: #fff; cursor: pointer; font-size: 14px;
}
.gallery-dialog__btn--confirm { background: #409eff; color: #fff; border-color: #409eff; }
.gallery-dialog__btn--cancel:hover { background: #f5f5f5; }
</style>
