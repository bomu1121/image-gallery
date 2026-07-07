/**
 * 云服务器配置存储管理
 * 使用 IndexedDB 存储云服务器配置和同步设置
 */

const DB_NAME = 'cloud_sync_db'
const SERVERS_STORE_NAME = 'servers'
const SETTINGS_STORE_NAME = 'settings'

export class CloudServerStorage {
  constructor() {
    this.db = null
  }

  /**
   * 打开数据库
   */
  async openDB() {
    if (this.db) return this.db

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1)
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result

        // 创建服务器配置存储
        if (!db.objectStoreNames.contains(SERVERS_STORE_NAME)) {
          const store = db.createObjectStore(SERVERS_STORE_NAME, {
            keyPath: 'id',
            autoIncrement: true
          })
          store.createIndex('name', 'name', { unique: false })
          store.createIndex('type', 'type', { unique: false })
          store.createIndex('createdAt', 'createdAt', { unique: false })
        }

        // 创建设置存储
        if (!db.objectStoreNames.contains(SETTINGS_STORE_NAME)) {
          const store = db.createObjectStore(SETTINGS_STORE_NAME, {
            keyPath: 'key'
          })
        }
      }

      request.onsuccess = () => {
        this.db = request.result
        resolve(this.db)
      }

      request.onerror = () => {
        reject(request.error)
      }
    })
  }

  /**
   * 添加云服务器
   */
  async addServer(serverConfig) {
    const db = await this.openDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(SERVERS_STORE_NAME, 'readwrite')
      const store = transaction.objectStore(SERVERS_STORE_NAME)
      
      const serverData = {
        ...serverConfig,
        id: serverConfig.id || Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        status: 'disconnected',
        syncing: false
      }

      const request = store.add(serverData)
      
      request.onsuccess = () => {
        resolve(serverData)
      }
      
      request.onerror = () => {
        reject(request.error)
      }
    })
  }

  /**
   * 获取所有云服务器
   */
  async getAllServers() {
    const db = await this.openDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(SERVERS_STORE_NAME, 'readonly')
      const store = transaction.objectStore(SERVERS_STORE_NAME)
      const request = store.getAll()
      
      request.onsuccess = () => {
        const servers = request.result.sort((a, b) => b.createdAt - a.createdAt)
        resolve(servers)
      }
      
      request.onerror = () => {
        reject(request.error)
      }
    })
  }

  /**
   * 根据ID获取云服务器
   */
  async getServerById(id) {
    const db = await this.openDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(SERVERS_STORE_NAME, 'readonly')
      const store = transaction.objectStore(SERVERS_STORE_NAME)
      const request = store.get(id)
      
      request.onsuccess = () => {
        resolve(request.result)
      }
      
      request.onerror = () => {
        reject(request.error)
      }
    })
  }

  /**
   * 更新云服务器
   */
  async updateServer(id, updates) {
    const db = await this.openDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(SERVERS_STORE_NAME, 'readwrite')
      const store = transaction.objectStore(SERVERS_STORE_NAME)
      
      // 先获取现有数据
      const getRequest = store.get(id)
      
      getRequest.onsuccess = () => {
        const existingData = getRequest.result
        if (!existingData) {
          reject(new Error('服务器不存在'))
          return
        }

        const updatedData = {
          ...existingData,
          ...updates,
          updatedAt: Date.now()
        }

        const putRequest = store.put(updatedData)
        
        putRequest.onsuccess = () => {
          resolve(updatedData)
        }
        
        putRequest.onerror = () => {
          reject(putRequest.error)
        }
      }
      
      getRequest.onerror = () => {
        reject(getRequest.error)
      }
    })
  }

  /**
   * 删除云服务器
   */
  async deleteServer(id) {
    const db = await this.openDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(SERVERS_STORE_NAME, 'readwrite')
      const store = transaction.objectStore(SERVERS_STORE_NAME)
      const request = store.delete(id)
      
      request.onsuccess = () => {
        resolve()
      }
      
      request.onerror = () => {
        reject(request.error)
      }
    })
  }

  /**
   * 设置活动服务器ID
   */
  async setActiveServerId(serverId) {
    const db = await this.openDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(SETTINGS_STORE_NAME, 'readwrite')
      const store = transaction.objectStore(SETTINGS_STORE_NAME)
      
      const settingData = {
        key: 'activeServerId',
        value: serverId,
        updatedAt: Date.now()
      }

      const request = store.put(settingData)
      
      request.onsuccess = () => {
        resolve()
      }
      
      request.onerror = () => {
        reject(request.error)
      }
    })
  }

  /**
   * 获取活动服务器ID
   */
  async getActiveServerId() {
    const db = await this.openDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(SETTINGS_STORE_NAME, 'readonly')
      const store = transaction.objectStore(SETTINGS_STORE_NAME)
      const request = store.get('activeServerId')
      
      request.onsuccess = () => {
        resolve(request.result ? request.result.value : null)
      }
      
      request.onerror = () => {
        reject(request.error)
      }
    })
  }

  /**
   * 设置同步设置
   */
  async setSyncSettings(settings) {
    const db = await this.openDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(SETTINGS_STORE_NAME, 'readwrite')
      const store = transaction.objectStore(SETTINGS_STORE_NAME)
      
      const settingData = {
        key: 'syncSettings',
        value: settings,
        updatedAt: Date.now()
      }

      const request = store.put(settingData)
      
      request.onsuccess = () => {
        resolve()
      }
      
      request.onerror = () => {
        reject(request.error)
      }
    })
  }

  /**
   * 获取同步设置
   */
  async getSyncSettings() {
    const db = await this.openDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(SETTINGS_STORE_NAME, 'readonly')
      const store = transaction.objectStore(SETTINGS_STORE_NAME)
      const request = store.get('syncSettings')
      
      request.onsuccess = () => {
        resolve(request.result ? request.result.value : {})
      }
      
      request.onerror = () => {
        reject(request.error)
      }
    })
  }

  /**
   * 更新服务器状态
   */
  async updateServerStatus(id, status) {
    return this.updateServer(id, { status })
  }

  /**
   * 更新服务器同步状态
   */
  async updateServerSyncing(id, syncing) {
    return this.updateServer(id, { syncing })
  }

  /**
   * 批量更新服务器状态
   */
  async batchUpdateServerStatus(updates) {
    const db = await this.openDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(SERVERS_STORE_NAME, 'readwrite')
      const store = transaction.objectStore(SERVERS_STORE_NAME)
      
      let completed = 0
      const total = updates.length
      
      if (total === 0) {
        resolve()
        return
      }

      updates.forEach(({ id, status, syncing }) => {
        const getRequest = store.get(id)
        
        getRequest.onsuccess = () => {
          const existingData = getRequest.result
          if (existingData) {
            const updatedData = {
              ...existingData,
              ...(status !== undefined && { status }),
              ...(syncing !== undefined && { syncing }),
              updatedAt: Date.now()
            }

            const putRequest = store.put(updatedData)
            
            putRequest.onsuccess = () => {
              completed++
              if (completed === total) {
                resolve()
              }
            }
            
            putRequest.onerror = () => {
              reject(putRequest.error)
            }
          } else {
            completed++
            if (completed === total) {
              resolve()
            }
          }
        }
        
        getRequest.onerror = () => {
          reject(getRequest.error)
        }
      })
    })
  }

  /**
   * 清空所有数据
   */
  async clearAll() {
    const db = await this.openDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SERVERS_STORE_NAME, SETTINGS_STORE_NAME], 'readwrite')
      
      const serversStore = transaction.objectStore(SERVERS_STORE_NAME)
      const settingsStore = transaction.objectStore(SETTINGS_STORE_NAME)
      
      const serversRequest = serversStore.clear()
      const settingsRequest = settingsStore.clear()
      
      let completed = 0
      const total = 2
      
      const checkComplete = () => {
        completed++
        if (completed === total) {
          resolve()
        }
      }
      
      serversRequest.onsuccess = checkComplete
      serversRequest.onerror = () => reject(serversRequest.error)
      
      settingsRequest.onsuccess = checkComplete
      settingsRequest.onerror = () => reject(settingsRequest.error)
    })
  }

  /**
   * 导出配置数据
   */
  async exportConfig() {
    const [servers, activeServerId, syncSettings] = await Promise.all([
      this.getAllServers(),
      this.getActiveServerId(),
      this.getSyncSettings()
    ])

    return {
      servers,
      activeServerId,
      syncSettings,
      exportTime: Date.now(),
      version: '1.0'
    }
  }

  /**
   * 导入配置数据
   */
  async importConfig(configData) {
    if (!configData || !configData.servers) {
      throw new Error('无效的配置数据')
    }

    const db = await this.openDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SERVERS_STORE_NAME, SETTINGS_STORE_NAME], 'readwrite')
      
      const serversStore = transaction.objectStore(SERVERS_STORE_NAME)
      const settingsStore = transaction.objectStore(SETTINGS_STORE_NAME)
      
      // 清空现有数据
      serversStore.clear()
      settingsStore.clear()
      
      // 导入服务器数据
      let completed = 0
      const total = configData.servers.length + 2 // +2 for activeServerId and syncSettings
      
      const checkComplete = () => {
        completed++
        if (completed === total) {
          resolve()
        }
      }
      
      // 导入服务器
      configData.servers.forEach((server, index) => {
        const request = serversStore.add(server)
        
        request.onsuccess = () => {
          if (index === configData.servers.length - 1) {
            checkComplete()
          }
        }
        
        request.onerror = () => {
          reject(request.error)
        }
      })
      
      // 导入活动服务器ID
      if (configData.activeServerId) {
        const activeServerRequest = settingsStore.put({
          key: 'activeServerId',
          value: configData.activeServerId,
          updatedAt: Date.now()
        })
        
        activeServerRequest.onsuccess = checkComplete
        activeServerRequest.onerror = () => reject(activeServerRequest.error)
      } else {
        checkComplete()
      }
      
      // 导入同步设置
      if (configData.syncSettings) {
        const syncSettingsRequest = settingsStore.put({
          key: 'syncSettings',
          value: configData.syncSettings,
          updatedAt: Date.now()
        })
        
        syncSettingsRequest.onsuccess = checkComplete
        syncSettingsRequest.onerror = () => reject(syncSettingsRequest.error)
      } else {
        checkComplete()
      }
    })
  }

  /**
   * 关闭数据库连接
   */
  close() {
    if (this.db) {
      this.db.close()
      this.db = null
    }
  }
}
