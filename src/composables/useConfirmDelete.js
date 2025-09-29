import { ref } from "vue";
import { useCustomDialog } from "./useCustomDialog.js";

/**
 * 确认删除弹窗组合式函数
 * 专门用于替代ElMessageBox.confirm的删除确认
 */
export function useConfirmDelete() {
  const { dialogVisible, dialogConfig, confirm } = useCustomDialog();

  /**
   * 显示删除确认对话框
   * @param {string} message - 删除确认消息
   * @param {string} title - 对话框标题
   * @param {Object} options - 额外选项
   * @returns {Promise} 返回Promise，resolve为确认删除，reject为取消
   */
  const deleteConfirm = (message, title = "确认删除", options = {}) => {
    return confirm({
      title,
      message,
      type: "warning",
      confirmButtonText: options.confirmButtonText || "确定删除",
      cancelButtonText: options.cancelButtonText || "取消",
      ...options,
    });
  };

  /**
   * 显示批量删除确认对话框
   * @param {number} count - 删除数量
   * @param {string} itemName - 项目名称（如图片、分组等）
   * @param {Object} options - 额外选项
   */
  const batchDeleteConfirm = (count, itemName = "项目", options = {}) => {
    const message = `确定要删除选中的 ${count} 个${itemName}吗？${
      options.warning || "此操作不可撤销！"
    }`;
    return deleteConfirm(message, "确认删除", options);
  };

  /**
   * 显示分组删除确认对话框
   * @param {string} groupName - 分组名称
   * @param {number} imageCount - 分组内图片数量
   * @param {Object} options - 额外选项
   */
  const groupDeleteConfirm = (groupName, imageCount = 0, options = {}) => {
    let message = `确定要删除分组 "${groupName}" 吗？`;
    if (imageCount > 0) {
      message += `\n分组内还有 ${imageCount} 张图片，删除后这些图片将移动到"未分组"。`;
    }
    return deleteConfirm(message, "确认删除分组", options);
  };

  /**
   * 显示云服务器删除确认对话框
   * @param {string} serverName - 服务器名称
   * @param {Object} options - 额外选项
   */
  const cloudServerDeleteConfirm = (serverName, options = {}) => {
    const message = `确定要删除云服务器配置 "${serverName}" 吗？\n删除后该服务器的同步配置将被清除。`;
    return deleteConfirm(message, "确认删除云服务器", options);
  };

  /**
   * 显示日志删除确认对话框
   * @param {string} logType - 日志类型
   * @param {Object} options - 额外选项
   */
  const logDeleteConfirm = (logType = "日志", options = {}) => {
    const message = `确定要清空所有${logType}吗？\n此操作将永久删除所有${logType}记录，无法恢复。`;
    return deleteConfirm(message, "确认清空", options);
  };

  /**
   * 显示恢复确认对话框
   * @param {number} count - 恢复数量
   * @param {string} itemName - 项目名称（如图片等）
   * @param {Object} options - 额外选项
   */
  const restoreConfirm = (count, itemName = "项目", options = {}) => {
    const message = `确定要恢复选中的 ${count} 个${itemName}吗？`;
    return confirm({
      title: "确认恢复",
      message,
      type: "info",
      confirmButtonText: options.confirmButtonText || "确定",
      cancelButtonText: options.cancelButtonText || "取消",
      ...options,
    });
  };

  return {
    dialogVisible,
    dialogConfig,
    deleteConfirm,
    batchDeleteConfirm,
    groupDeleteConfirm,
    cloudServerDeleteConfirm,
    logDeleteConfirm,
    restoreConfirm,
  };
}
