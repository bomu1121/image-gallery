import { ref } from "vue";

/**
 * 自定义对话框组合式函数
 * 用于替代Element Plus的MessageBox
 */
export function useCustomDialog() {
  const dialogVisible = ref(false);
  const dialogConfig = ref({
    title: "提示",
    message: "",
    type: "info",
    showCancelButton: true,
    confirmButtonText: "确定",
    cancelButtonText: "取消",
  });

  /**
   * 显示确认对话框
   * @param {Object} options - 配置选项
   * @param {string} options.title - 标题
   * @param {string} options.message - 消息内容
   * @param {string} options.type - 类型 (info, warning, error, success)
   * @param {boolean} options.showCancelButton - 是否显示取消按钮
   * @param {string} options.confirmButtonText - 确认按钮文字
   * @param {string} options.cancelButtonText - 取消按钮文字
   * @returns {Promise} 返回Promise，resolve为确认，reject为取消
   */
  const confirm = (options = {}) => {
    return new Promise((resolve, reject) => {
      // 合并配置
      dialogConfig.value = {
        ...dialogConfig.value,
        ...options,
      };

      dialogVisible.value = true;

      // 监听确认事件
      const handleConfirm = () => {
        dialogVisible.value = false;
        resolve();
      };

      // 监听取消事件
      const handleCancel = () => {
        dialogVisible.value = false;
        reject(new Error("用户取消"));
      };

      // 存储事件处理器（实际使用时需要绑定到组件）
      dialogConfig.value._onConfirm = handleConfirm;
      dialogConfig.value._onCancel = handleCancel;
    });
  };

  /**
   * 显示警告对话框
   */
  const warning = (message, title = "警告") => {
    return confirm({
      title,
      message,
      type: "warning",
    });
  };

  /**
   * 显示错误对话框
   */
  const error = (message, title = "错误") => {
    return confirm({
      title,
      message,
      type: "error",
    });
  };

  /**
   * 显示成功对话框
   */
  const success = (message, title = "成功") => {
    return confirm({
      title,
      message,
      type: "success",
      showCancelButton: false,
    });
  };

  /**
   * 显示信息对话框
   */
  const info = (message, title = "提示") => {
    return confirm({
      title,
      message,
      type: "info",
    });
  };

  /**
   * 显示删除确认对话框
   */
  const deleteConfirm = (message = "确定要删除吗？", title = "删除确认") => {
    return confirm({
      title,
      message,
      type: "warning",
      confirmButtonText: "删除",
      cancelButtonText: "取消",
    });
  };

  return {
    dialogVisible,
    dialogConfig,
    confirm,
    warning,
    error,
    success,
    info,
    deleteConfirm,
  };
}

/**
 * 全局对话框服务
 * 可以在任何地方调用的对话框
 */
export const dialogService = {
  install(app) {
    const {
      dialogVisible,
      dialogConfig,
      confirm,
      warning,
      error,
      success,
      info,
      deleteConfirm,
    } = useCustomDialog();

    app.config.globalProperties.$dialog = {
      confirm,
      warning,
      error,
      success,
      info,
      deleteConfirm,
    };

    app.provide("dialogVisible", dialogVisible);
    app.provide("dialogConfig", dialogConfig);
  },
};
