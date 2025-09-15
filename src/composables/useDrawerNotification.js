import { ref, reactive, nextTick } from "vue";

// 全局通知状态
const notifications = ref([]);
let notificationId = 0;

export function useDrawerNotification() {
  // 添加通知
  function showNotification(options) {
    const id = ++notificationId;
    const notification = reactive({
      id,
      visible: false, // 先设置为不可见
      type: options.type || "info",
      title: options.title || "",
      message: options.message || "",
      detail: options.detail || "",
      duration: options.duration || 0,
      closable: options.closable !== false,
      showProgress: options.showProgress || false,
      progress: options.progress || 0,
    });

    notifications.value.push(notification);

    // 在下一个 tick 中设置为可见，触发进入动画
    nextTick(() => {
      notification.visible = true;
    });

    // 自动关闭
    if (notification.duration > 0) {
      setTimeout(() => {
        closeNotification(id);
      }, notification.duration);
    }

    return id;
  }

  // 关闭通知
  function closeNotification(id) {
    const index = notifications.value.findIndex((n) => n.id === id);
    if (index !== -1) {
      notifications.value[index].visible = false;
      // 延迟移除，等待动画完成
      setTimeout(() => {
        notifications.value.splice(index, 1);
      }, 400);
    }
  }

  // 更新通知进度
  function updateNotificationProgress(id, progress, message, detail) {
    const notification = notifications.value.find((n) => n.id === id);
    if (notification) {
      notification.progress = progress;
      if (message) notification.message = message;
      if (detail) notification.detail = detail;
    }
  }

  // 更新通知状态
  function updateNotificationStatus(id, status, message, detail) {
    const notification = notifications.value.find((n) => n.id === id);
    if (notification) {
      notification.status = status;
      if (message) notification.message = message;
      if (detail) notification.detail = detail;

      // 根据状态更新类型
      if (status === "success") {
        notification.type = "success";
      } else if (status === "exception") {
        notification.type = "error";
      }
    }
  }

  // 关闭所有通知
  function closeAllNotifications() {
    notifications.value.forEach((notification) => {
      notification.visible = false;
    });
    setTimeout(() => {
      notifications.value.length = 0;
    }, 400);
  }

  // 便捷方法
  function success(message, options = {}) {
    return showNotification({
      type: "success",
      message,
      duration: 3000,
      ...options,
    });
  }

  function error(message, options = {}) {
    return showNotification({
      type: "error",
      message,
      duration: 5000,
      ...options,
    });
  }

  function warning(message, options = {}) {
    return showNotification({
      type: "warning",
      message,
      duration: 4000,
      ...options,
    });
  }

  function info(message, options = {}) {
    return showNotification({
      type: "info",
      message,
      duration: 3000,
      ...options,
    });
  }

  // 显示进度通知
  function showProgressNotification(message, options = {}) {
    return showNotification({
      type: "info",
      message,
      showProgress: true,
      progress: 0,
      closable: false,
      duration: 0,
      ...options,
    });
  }

  return {
    notifications,
    showNotification,
    closeNotification,
    updateNotificationProgress,
    updateNotificationStatus,
    closeAllNotifications,
    success,
    error,
    warning,
    info,
    showProgressNotification,
  };
}
