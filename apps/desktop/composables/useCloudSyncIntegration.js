/**
 * 云同步集成组合式函数
 * 用于在主应用中集成云同步功能
 */

import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useCloudSync } from './useCloudSync'
import { CloudSyncService } from '../services/CloudSyncService'

export const useCloudSyncIntegration = () => {
  const {
    initializeData,
    activeServer,
    syncSettings,
    cloudSyncService
  } = useCloudSync()

  const isInitialized = ref(false)
  const syncStatusMonitor = ref(null)

  /**
   * 初始化云同步功能
   */
  const initializeCloudSync = async () => {
    try {
      await initializeData()
      isInitialized.value = true
      
      // 如果启用了自动同步且有活动服务器，启动自动同步
      if (syncSettings.value.autoSync && activeServer.value) {
        await cloudSyncService.startAutoSync()
      }
      
      console.log('云同步功能初始化完成')
    } catch (error) {
      console.error('云同步功能初始化失败:', error)
      ElMessage.error('云同步功能初始化失败')
    }
  }

  /**
   * 处理数据变更事件，触发自动同步
   */
  const handleDataChange = async (changeType, data) => {
    if (!isInitialized.value || !syncSettings.value.autoSync || !activeServer.value) {
      return
    }

    try {
      // 实时同步
      if (syncSettings.value.syncInterval === 'realtime') {
        await cloudSyncService.syncData(activeServer.value.id)
      }
    } catch (error) {
      console.error('自动同步失败:', error)
      // 不显示错误消息，避免干扰用户操作
    }
  }

  /**
   * 监听图片相关操作
   */
  const setupImageSyncListeners = () => {
    // 监听图片上传
    const originalPutImage = window.putImage
    if (originalPutImage) {
      window.putImage = async (...args) => {
        const result = await originalPutImage(...args)
        await handleDataChange('image_add', result)
        return result
      }
    }

    // 监听图片更新
    const originalUpdateImage = window.updateImage
    if (originalUpdateImage) {
      window.updateImage = async (...args) => {
        const result = await originalUpdateImage(...args)
        await handleDataChange('image_update', result)
        return result
      }
    }

    // 监听图片删除
    const originalDeleteImage = window.deleteImage
    if (originalDeleteImage) {
      window.deleteImage = async (...args) => {
        const result = await originalDeleteImage(...args)
        await handleDataChange('image_delete', result)
        return result
      }
    }
  }

  /**
   * 监听分组相关操作
   */
  const setupGroupSyncListeners = () => {
    // 监听分组创建
    const originalPutGroup = window.putGroup
    if (originalPutGroup) {
      window.putGroup = async (...args) => {
        const result = await originalPutGroup(...args)
        await handleDataChange('group_add', result)
        return result
      }
    }

    // 监听分组更新
    const originalUpdateGroup = window.updateGroup
    if (originalUpdateGroup) {
      window.updateGroup = async (...args) => {
        const result = await originalUpdateGroup(...args)
        await handleDataChange('group_update', result)
        return result
      }
    }

    // 监听分组删除
    const originalDeleteGroup = window.deleteGroup
    if (originalDeleteGroup) {
      window.deleteGroup = async (...args) => {
        const result = await originalDeleteGroup(...args)
        await handleDataChange('group_delete', result)
        return result
      }
    }
  }

  /**
   * 监听背景设置变更
   */
  const setupBackgroundSyncListeners = () => {
    // 监听背景设置变更
    const originalPutBackground = window.putBackground
    if (originalPutBackground) {
      window.putBackground = async (...args) => {
        const result = await originalPutBackground(...args)
        await handleDataChange('background_update', result)
        return result
      }
    }

    // 监听背景删除
    const originalDeleteBackground = window.deleteBackground
    if (originalDeleteBackground) {
      window.deleteBackground = async (...args) => {
        const result = await originalDeleteBackground(...args)
        await handleDataChange('background_delete', result)
        return result
      }
    }
  }

  /**
   * 设置所有同步监听器
   */
  const setupSyncListeners = () => {
    setupImageSyncListeners()
    setupGroupSyncListeners()
    setupBackgroundSyncListeners()
  }

  /**
   * 清理同步监听器
   */
  const cleanupSyncListeners = () => {
    // 这里可以添加清理逻辑，如果需要的话
  }

  /**
   * 手动触发全量同步
   */
  const triggerFullSync = async () => {
    if (!activeServer.value) {
      ElMessage.warning('请先配置云服务器')
      return false
    }

    try {
      ElMessage.info('开始全量同步...')
      await cloudSyncService.syncData(activeServer.value.id)
      ElMessage.success('全量同步完成')
      return true
    } catch (error) {
      ElMessage.error('全量同步失败: ' + error.message)
      return false
    }
  }

  /**
   * 检查同步状态
   */
  const checkSyncStatus = () => {
    return {
      isInitialized: isInitialized.value,
      hasActiveServer: !!activeServer.value,
      autoSyncEnabled: syncSettings.value.autoSync,
      syncInterval: syncSettings.value.syncInterval,
      conflictResolution: syncSettings.value.conflictResolution
    }
  }

  /**
   * 获取同步统计信息
   */
  const getSyncStats = () => {
    try {
      const stats = localStorage.getItem('sync_stats')
      return stats ? JSON.parse(stats) : {
        totalSyncs: 0,
        successfulSyncs: 0,
        failedSyncs: 0
      }
    } catch (error) {
      console.error('获取同步统计失败:', error)
      return {
        totalSyncs: 0,
        successfulSyncs: 0,
        failedSyncs: 0
      }
    }
  }

  /**
   * 重置同步统计
   */
  const resetSyncStats = () => {
    try {
      localStorage.removeItem('sync_stats')
      localStorage.removeItem('last_sync_time')
      ElMessage.success('同步统计已重置')
    } catch (error) {
      console.error('重置同步统计失败:', error)
      ElMessage.error('重置同步统计失败')
    }
  }

  /**
   * 导出同步配置
   */
  const exportSyncConfig = async () => {
    try {
      const config = await cloudSyncService.cloudServerStorage.exportConfig()
      const blob = new Blob([JSON.stringify(config, null, 2)], {
        type: 'application/json'
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cloud-sync-config-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      ElMessage.success('同步配置已导出')
    } catch (error) {
      console.error('导出同步配置失败:', error)
      ElMessage.error('导出同步配置失败')
    }
  }

  /**
   * 导入同步配置
   */
  const importSyncConfig = async (file) => {
    try {
      const text = await file.text()
      const config = JSON.parse(text)
      
      await cloudSyncService.cloudServerStorage.importConfig(config)
      await initializeData() // 重新初始化数据
      
      ElMessage.success('同步配置已导入')
      return true
    } catch (error) {
      console.error('导入同步配置失败:', error)
      ElMessage.error('导入同步配置失败: ' + error.message)
      return false
    }
  }

  // 组件挂载时初始化
  onMounted(async () => {
    await initializeCloudSync()
    setupSyncListeners()
  })

  // 组件卸载时清理
  onUnmounted(() => {
    cleanupSyncListeners()
    cloudSyncService.destroy()
  })

  return {
    // 状态
    isInitialized,
    activeServer,
    syncSettings,
    
    // 方法
    initializeCloudSync,
    triggerFullSync,
    checkSyncStatus,
    getSyncStats,
    resetSyncStats,
    exportSyncConfig,
    importSyncConfig,
    handleDataChange,
    
    // 服务实例
    cloudSyncService
  }
}
