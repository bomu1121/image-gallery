import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { CloudSyncService } from '../services/CloudSyncService'
import { CloudServerStorage } from '../utils/CloudServerStorage'

// 云同步服务实例
const cloudSyncService = new CloudSyncService()
const cloudServerStorage = new CloudServerStorage()

// 响应式状态
const cloudServers = ref([])
const activeServerId = ref(null)
const syncSettings = ref({
  autoSync: false,
  syncInterval: 'realtime',
  conflictResolution: 'ask'
})

// 初始化数据
const initializeData = async () => {
  try {
    // 加载云服务器配置
    const servers = await cloudServerStorage.getAllServers()
    cloudServers.value = servers

    // 加载活动服务器
    const activeId = await cloudServerStorage.getActiveServerId()
    activeServerId.value = activeId

    // 加载同步设置
    const settings = await cloudServerStorage.getSyncSettings()
    syncSettings.value = { ...syncSettings.value, ...settings }

    // 初始化云同步服务
    await cloudSyncService.initialize(servers, activeId, settings)
  } catch (error) {
    console.error('初始化云同步数据失败:', error)
    ElMessage.error('初始化云同步功能失败')
  }
}

// 添加云服务器
const addServer = async (serverConfig) => {
  try {
    const server = await cloudServerStorage.addServer(serverConfig)
    cloudServers.value.push(server)
    
    // 如果没有活动服务器，自动设置为活动服务器
    if (!activeServerId.value) {
      await setActiveServer(server.id)
    }
    
    // 更新云同步服务
    await cloudSyncService.updateServers(cloudServers.value)
    
    return server
  } catch (error) {
    console.error('添加云服务器失败:', error)
    throw error
  }
}

// 更新云服务器
const updateServer = async (serverId, updates) => {
  try {
    const updatedServer = await cloudServerStorage.updateServer(serverId, updates)
    const index = cloudServers.value.findIndex(s => s.id === serverId)
    if (index !== -1) {
      cloudServers.value[index] = updatedServer
    }
    
    // 更新云同步服务
    await cloudSyncService.updateServers(cloudServers.value)
    
    return updatedServer
  } catch (error) {
    console.error('更新云服务器失败:', error)
    throw error
  }
}

// 删除云服务器
const deleteServer = async (serverId) => {
  try {
    await cloudServerStorage.deleteServer(serverId)
    cloudServers.value = cloudServers.value.filter(s => s.id !== serverId)
    
    // 如果删除的是活动服务器，选择新的活动服务器
    if (activeServerId.value === serverId) {
      const newActiveId = cloudServers.value.length > 0 ? cloudServers.value[0].id : null
      await setActiveServer(newActiveId)
    }
    
    // 更新云同步服务
    await cloudSyncService.updateServers(cloudServers.value)
  } catch (error) {
    console.error('删除云服务器失败:', error)
    throw error
  }
}

// 设置活动服务器
const setActiveServer = async (serverId) => {
  try {
    if (serverId) {
      await cloudServerStorage.setActiveServerId(serverId)
      activeServerId.value = serverId
      
      // 更新云同步服务
      await cloudSyncService.setActiveServer(serverId)
      
      ElMessage.success('已切换到新的云服务器')
    } else {
      await cloudServerStorage.setActiveServerId(null)
      activeServerId.value = null
      await cloudSyncService.setActiveServer(null)
    }
  } catch (error) {
    console.error('设置活动服务器失败:', error)
    throw error
  }
}

// 同步服务器数据
const syncServer = async (serverId) => {
  try {
    const server = cloudServers.value.find(s => s.id === serverId)
    if (!server) {
      throw new Error('服务器不存在')
    }
    
    // 更新服务器状态为同步中
    server.status = 'syncing'
    server.syncing = true
    
    try {
      await cloudSyncService.syncData(serverId)
      server.status = 'connected'
      ElMessage.success('数据同步完成')
    } catch (syncError) {
      server.status = 'error'
      throw syncError
    } finally {
      server.syncing = false
    }
  } catch (error) {
    console.error('同步服务器数据失败:', error)
    ElMessage.error('数据同步失败: ' + error.message)
    throw error
  }
}

// 测试服务器连接
const testServerConnection = async (serverConfig) => {
  try {
    return await cloudSyncService.testConnection(serverConfig)
  } catch (error) {
    console.error('测试服务器连接失败:', error)
    return { success: false, error: error.message }
  }
}

// 更新同步设置
const updateSyncSettings = async (newSettings) => {
  try {
    await cloudServerStorage.setSyncSettings(newSettings)
    syncSettings.value = { ...syncSettings.value, ...newSettings }
    
    // 更新云同步服务
    await cloudSyncService.updateSyncSettings(newSettings)
  } catch (error) {
    console.error('更新同步设置失败:', error)
    throw error
  }
}

// 获取当前活动服务器
const activeServer = computed(() => {
  return cloudServers.value.find(s => s.id === activeServerId.value)
})

// 获取服务器连接状态
const getServerStatus = (serverId) => {
  const server = cloudServers.value.find(s => s.id === serverId)
  return server ? server.status : 'unknown'
}

// 监听同步设置变化，自动启动/停止自动同步
watch(
  () => syncSettings.value.autoSync,
  (autoSync) => {
    if (autoSync && activeServerId.value) {
      cloudSyncService.startAutoSync()
    } else {
      cloudSyncService.stopAutoSync()
    }
  }
)

// 监听活动服务器变化
watch(
  () => activeServerId.value,
  (newActiveId) => {
    if (newActiveId && syncSettings.value.autoSync) {
      cloudSyncService.startAutoSync()
    }
  }
)

// 导出组合式函数
export const useCloudSync = () => {
  return {
    // 状态
    cloudServers,
    activeServerId,
    syncSettings,
    activeServer,
    
    // 方法
    initializeData,
    addServer,
    updateServer,
    deleteServer,
    setActiveServer,
    syncServer,
    testServerConnection,
    updateSyncSettings,
    getServerStatus,
    
    // 服务实例（用于高级操作）
    cloudSyncService,
    cloudServerStorage
  }
}
