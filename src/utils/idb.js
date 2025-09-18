// A tiny IndexedDB helper tailored for storing image binaries and metadata
// API: openDB, putImage, getAllImages, getImageById, updateImage, deleteImage, clearAll

const DB_NAME = "image_gallery_db";
const STORE_NAME = "images";
const GROUPS_STORE_NAME = "groups";
const BACKGROUND_STORE_NAME = "background";
const ANALYSIS_LOGS_STORE_NAME = "analysis_logs";

function openDB() {
  return new Promise((resolve, reject) => {
    // 不显式指定版本，避免出现“请求版本小于现有版本”的错误
    const request = indexedDB.open(DB_NAME);
    request.onupgradeneeded = (event) => {
      const db = request.result;

      // 创建图片存储
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: "id",
          autoIncrement: true,
        });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }

      // 创建分组存储
      if (!db.objectStoreNames.contains(GROUPS_STORE_NAME)) {
        const groupsStore = db.createObjectStore(GROUPS_STORE_NAME, {
          keyPath: "id",
          autoIncrement: true,
        });
        groupsStore.createIndex("createdAt", "createdAt", { unique: false });
      }

      // 创建背景图存储
      if (!db.objectStoreNames.contains(BACKGROUND_STORE_NAME)) {
        const backgroundStore = db.createObjectStore(BACKGROUND_STORE_NAME, {
          keyPath: "id",
          autoIncrement: true,
        });
        backgroundStore.createIndex("createdAt", "createdAt", {
          unique: false,
        });
      }

      // 创建AI分析日志存储
      if (!db.objectStoreNames.contains(ANALYSIS_LOGS_STORE_NAME)) {
        const analysisLogsStore = db.createObjectStore(
          ANALYSIS_LOGS_STORE_NAME,
          {
            keyPath: "id",
            autoIncrement: true,
          }
        );
        analysisLogsStore.createIndex("timestamp", "timestamp", {
          unique: false,
        });
        analysisLogsStore.createIndex("imageName", "imageName", {
          unique: false,
        });
        analysisLogsStore.createIndex("aiService", "aiService", {
          unique: false,
        });
        analysisLogsStore.createIndex("status", "status", { unique: false });
      }
    };
    request.onblocked = () => {
      console.warn(
        "[idb] openDB blocked: another connection is preventing upgrade"
      );
    };
    request.onsuccess = () => {
      const db = request.result;
      // 若有新版本升级请求，主动关闭旧连接，避免 blocked
      db.onversionchange = () => {
        try {
          db.close();
        } catch {}
      };
      resolve(db);
    };
    request.onerror = () => reject(request.error);
  });
}

// 确保分组对象仓库存在（若缺失则触发一次版本升级创建之）
async function ensureGroupsStoreExists() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME);
    req.onsuccess = () => {
      const db = req.result;
      if (db.objectStoreNames.contains(GROUPS_STORE_NAME)) {
        db.close();
        resolve();
        return;
      }

      const nextVersion = db.version + 1;
      db.close();

      const upgradeReq = indexedDB.open(DB_NAME, nextVersion);
      upgradeReq.onupgradeneeded = () => {
        const udb = upgradeReq.result;
        if (!udb.objectStoreNames.contains(GROUPS_STORE_NAME)) {
          const groupsStore = udb.createObjectStore(GROUPS_STORE_NAME, {
            keyPath: "id",
            autoIncrement: true,
          });
          groupsStore.createIndex("createdAt", "createdAt", { unique: false });
        }
      };
      upgradeReq.onblocked = () => {
        console.warn("[idb] ensureGroupsStoreExists upgrade blocked");
      };
      upgradeReq.onsuccess = () => {
        upgradeReq.result.close();
        resolve();
      };
      upgradeReq.onerror = () => reject(upgradeReq.error);
    };
    req.onblocked = () => {
      console.warn("[idb] ensureGroupsStoreExists open blocked");
    };
    req.onerror = () => reject(req.error);
  });
}

// 确保背景对象仓库存在（若缺失则触发一次版本升级创建之）
async function ensureBackgroundStoreExists() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME);
    req.onsuccess = () => {
      const db = req.result;
      if (db.objectStoreNames.contains(BACKGROUND_STORE_NAME)) {
        db.close();
        resolve();
        return;
      }

      const nextVersion = db.version + 1;
      db.close();

      const upgradeReq = indexedDB.open(DB_NAME, nextVersion);
      upgradeReq.onupgradeneeded = () => {
        const udb = upgradeReq.result;
        if (!udb.objectStoreNames.contains(BACKGROUND_STORE_NAME)) {
          const backgroundStore = udb.createObjectStore(BACKGROUND_STORE_NAME, {
            keyPath: "id",
            autoIncrement: true,
          });
          backgroundStore.createIndex("createdAt", "createdAt", {
            unique: false,
          });
        }
      };
      upgradeReq.onblocked = () => {
        console.warn("[idb] ensureBackgroundStoreExists upgrade blocked");
      };
      upgradeReq.onsuccess = () => {
        upgradeReq.result.close();
        resolve();
      };
      upgradeReq.onerror = () => reject(upgradeReq.error);
    };
    req.onblocked = () => {
      console.warn("[idb] ensureBackgroundStoreExists open blocked");
    };
    req.onerror = () => reject(req.error);
  });
}

export async function putImage(image) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const now = Date.now();

    // 确保数据可以被IndexedDB克隆
    const data = {
      ...image,
      createdAt: image.createdAt || now,
      // 确保tags是纯数组
      tags: image.tags ? [...image.tags] : [],
    };

    // 调试日志
    console.log(`putImage: ${image.name}`, {
      originalTags: image.tags,
      finalTags: data.tags,
      notes: data.notes,
    });

    // 移除可能导致克隆问题的字段
    delete data.objectUrl;

    const req = store.add(data);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getAllImages() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () =>
      resolve(req.result.sort((a, b) => b.createdAt - a.createdAt));
    req.onerror = () => reject(req.error);
  });
}

export async function getImageById(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function updateImage(id, updates) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    // 先获取现有数据
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const existingData = getReq.result;
      if (!existingData) {
        reject(new Error("Image not found"));
        return;
      }

      // 合并更新数据，确保数据可以被IndexedDB克隆
      const updatedData = {
        ...existingData,
        ...updates,
        // 确保tags是纯数组，不包含任何复杂对象
        tags: updates.tags
          ? [...updates.tags]
          : existingData.tags
          ? [...existingData.tags]
          : [],
      };

      // 移除可能导致克隆问题的字段
      delete updatedData.objectUrl;

      const putReq = store.put(updatedData);
      putReq.onsuccess = () => resolve(putReq.result);
      putReq.onerror = () => reject(putReq.error);
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

export async function deleteImage(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function clearAll() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// 分组相关函数
export async function putGroup(group) {
  await ensureGroupsStoreExists();
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(GROUPS_STORE_NAME, "readwrite");
    const store = tx.objectStore(GROUPS_STORE_NAME);
    const now = Date.now();
    const data = { ...group, createdAt: group.createdAt || now };
    // 使用 put 以兼容已存在主键（例如默认分组 id=0）
    const req = store.put(data);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getAllGroups() {
  await ensureGroupsStoreExists();
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(GROUPS_STORE_NAME, "readonly");
    const store = tx.objectStore(GROUPS_STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () =>
      resolve(req.result.sort((a, b) => b.createdAt - a.createdAt));
    req.onerror = () => reject(req.error);
  });
}

export async function getGroupById(id) {
  await ensureGroupsStoreExists();
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(GROUPS_STORE_NAME, "readonly");
    const store = tx.objectStore(GROUPS_STORE_NAME);
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function updateGroup(id, updates) {
  await ensureGroupsStoreExists();
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(GROUPS_STORE_NAME, "readwrite");
    const store = tx.objectStore(GROUPS_STORE_NAME);

    // 先获取现有数据
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const existingData = getReq.result;
      if (!existingData) {
        reject(new Error("Group not found"));
        return;
      }

      // 合并更新数据，确保数据可以被IndexedDB克隆
      const updatedData = { ...existingData, ...updates };

      // 移除可能导致克隆问题的字段
      delete updatedData.objectUrl;

      const putReq = store.put(updatedData);
      putReq.onsuccess = () => resolve(putReq.result);
      putReq.onerror = () => reject(putReq.error);
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

export async function deleteGroup(id) {
  await ensureGroupsStoreExists();
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(GROUPS_STORE_NAME, "readwrite");
    const store = tx.objectStore(GROUPS_STORE_NAME);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function clearAllGroups() {
  await ensureGroupsStoreExists();
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(GROUPS_STORE_NAME, "readwrite");
    const store = tx.objectStore(GROUPS_STORE_NAME);
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// 背景图相关函数
export async function putBackground(backgroundData) {
  await ensureBackgroundStoreExists();
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BACKGROUND_STORE_NAME, "readwrite");
    const store = tx.objectStore(BACKGROUND_STORE_NAME);
    const now = Date.now();
    const data = {
      ...backgroundData,
      createdAt: backgroundData.createdAt || now,
    };
    // 使用 put 以覆盖现有背景图（只保存一张背景图）
    const req = store.put({ id: 1, ...data });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getBackground() {
  await ensureBackgroundStoreExists();
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BACKGROUND_STORE_NAME, "readonly");
    const store = tx.objectStore(BACKGROUND_STORE_NAME);
    const req = store.get(1); // 获取 id 为 1 的背景图
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteBackground() {
  await ensureBackgroundStoreExists();
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BACKGROUND_STORE_NAME, "readwrite");
    const store = tx.objectStore(BACKGROUND_STORE_NAME);
    const req = store.delete(1); // 删除 id 为 1 的背景图
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ==================== AI分析日志相关方法 ====================

/**
 * 保存AI分析日志
 * @param {Object} analysisLog - 分析日志对象
 * @returns {Promise<number>} 返回保存的日志ID
 */
export async function putAnalysisLog(analysisLog) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ANALYSIS_LOGS_STORE_NAME, "readwrite");
    const store = tx.objectStore(ANALYSIS_LOGS_STORE_NAME);

    // 确保timestamp是Date对象
    const logToSave = {
      ...analysisLog,
      timestamp:
        analysisLog.timestamp instanceof Date
          ? analysisLog.timestamp
          : new Date(analysisLog.timestamp),
      savedAt: new Date(),
    };

    const req = store.put(logToSave);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * 批量保存AI分析日志
 * @param {Array} analysisLogs - 分析日志数组
 * @returns {Promise<Array>} 返回保存的日志ID数组
 */
export async function putAnalysisLogs(analysisLogs) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ANALYSIS_LOGS_STORE_NAME, "readwrite");
    const store = tx.objectStore(ANALYSIS_LOGS_STORE_NAME);

    const promises = analysisLogs.map((log) => {
      const logToSave = {
        ...log,
        timestamp:
          log.timestamp instanceof Date
            ? log.timestamp
            : new Date(log.timestamp),
        savedAt: new Date(),
      };
      return new Promise((resolveItem, rejectItem) => {
        const req = store.put(logToSave);
        req.onsuccess = () => resolveItem(req.result);
        req.onerror = () => rejectItem(req.error);
      });
    });

    Promise.all(promises)
      .then((results) => resolve(results))
      .catch((error) => reject(error));
  });
}

/**
 * 获取所有AI分析日志
 * @returns {Promise<Array>} 返回所有分析日志
 */
export async function getAllAnalysisLogs() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ANALYSIS_LOGS_STORE_NAME, "readonly");
    const store = tx.objectStore(ANALYSIS_LOGS_STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => {
      const logs = req.result.map((log) => ({
        ...log,
        timestamp: new Date(log.timestamp),
      }));
      // 按时间戳倒序排列（最新的在前）
      logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      resolve(logs);
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * 根据ID获取AI分析日志
 * @param {string} logId - 日志ID
 * @returns {Promise<Object|null>} 返回分析日志或null
 */
export async function getAnalysisLogById(logId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ANALYSIS_LOGS_STORE_NAME, "readonly");
    const store = tx.objectStore(ANALYSIS_LOGS_STORE_NAME);
    const req = store.get(logId);
    req.onsuccess = () => {
      const log = req.result;
      if (log) {
        log.timestamp = new Date(log.timestamp);
      }
      resolve(log);
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * 根据图片名称搜索分析日志
 * @param {string} imageName - 图片名称
 * @returns {Promise<Array>} 返回匹配的分析日志
 */
export async function getAnalysisLogsByImageName(imageName) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ANALYSIS_LOGS_STORE_NAME, "readonly");
    const store = tx.objectStore(ANALYSIS_LOGS_STORE_NAME);
    const index = store.index("imageName");
    const req = index.getAll(imageName);
    req.onsuccess = () => {
      const logs = req.result.map((log) => ({
        ...log,
        timestamp: new Date(log.timestamp),
      }));
      logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      resolve(logs);
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * 根据AI服务搜索分析日志
 * @param {string} aiService - AI服务名称
 * @returns {Promise<Array>} 返回匹配的分析日志
 */
export async function getAnalysisLogsByAIService(aiService) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ANALYSIS_LOGS_STORE_NAME, "readonly");
    const store = tx.objectStore(ANALYSIS_LOGS_STORE_NAME);
    const index = store.index("aiService");
    const req = index.getAll(aiService);
    req.onsuccess = () => {
      const logs = req.result.map((log) => ({
        ...log,
        timestamp: new Date(log.timestamp),
      }));
      logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      resolve(logs);
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * 删除AI分析日志
 * @param {string} logId - 日志ID
 * @returns {Promise<void>}
 */
export async function deleteAnalysisLog(logId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ANALYSIS_LOGS_STORE_NAME, "readwrite");
    const store = tx.objectStore(ANALYSIS_LOGS_STORE_NAME);
    const req = store.delete(logId);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * 清空所有AI分析日志
 * @returns {Promise<void>}
 */
export async function clearAllAnalysisLogs() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ANALYSIS_LOGS_STORE_NAME, "readwrite");
    const store = tx.objectStore(ANALYSIS_LOGS_STORE_NAME);
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * 获取分析日志统计信息
 * @returns {Promise<Object>} 返回统计信息
 */
export async function getAnalysisLogsStatistics() {
  const logs = await getAllAnalysisLogs();
  const total = logs.length;
  const completed = logs.filter((log) => log.status === "completed").length;
  const failed = logs.filter((log) => log.status === "failed").length;
  const processing = logs.filter((log) => log.status === "processing").length;

  const avgDuration =
    total > 0
      ? logs.reduce((sum, log) => sum + (log.duration || 0), 0) / total
      : 0;

  return {
    total,
    completed,
    failed,
    processing,
    avgDuration: avgDuration / 1000, // 转换为秒
    successRate: total > 0 ? ((completed / total) * 100).toFixed(1) : 0,
  };
}
