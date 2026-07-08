import { ref } from 'vue';
import type { Notification } from './types';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

export function useNotification() {
  const items = ref<Notification[]>([]);

  function add(type: Notification['type'], title: string, message: string) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    items.value.push({ id, title, message, type });
    setTimeout(() => dismiss(id), 4000);
    return id;
  }

  function dismiss(id: string) {
    items.value = items.value.filter((n) => n.id !== id);
  }

  const success = (title: string, msg = '') => add('success', title, msg);
  const error = (title: string, msg = '') => add('error', title, msg);
  const warning = (title: string, msg = '') => add('warning', title, msg);
  const info = (title: string, msg = '') => add('info', title, msg);

  return { items, success, error, warning, info, dismiss };
}
