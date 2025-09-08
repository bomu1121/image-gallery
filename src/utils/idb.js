// A tiny IndexedDB helper tailored for storing image binaries and metadata
// API: openDB, putImage, getAllImages, getImageById, updateImage, deleteImage, clearAll

const DB_NAME = "image_gallery_db";
const STORE_NAME = "images";
const GROUPS_STORE_NAME = "groups";

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

export async function putImage(image) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const now = Date.now();
    const data = { ...image, createdAt: image.createdAt || now };
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

      // 合并更新数据
      const updatedData = { ...existingData, ...updates };
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

      // 合并更新数据
      const updatedData = { ...existingData, ...updates };
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
