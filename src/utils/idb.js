// A tiny IndexedDB helper tailored for storing image binaries and metadata
// API: openDB, putImage, getAllImages, getImageById, updateImage, deleteImage, clearAll

const DB_NAME = "image_gallery_db";
const STORE_NAME = "images";
const GROUPS_STORE_NAME = "groups";
const BACKGROUND_STORE_NAME = "background";
const ANALYSIS_LOGS_STORE_NAME = "analysis_logs";
const ALBUMS_STORE_NAME = "albums";
const ALBUM_ITEMS_STORE_NAME = "album_items";
const TRASH_STORE_NAME = "trash";

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
        // 新增索引：parentImageId（附图模式）
        store.createIndex("parentImageId", "parentImageId", {
          unique: false,
        });
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

      // 创建相册（组图）存储
      if (!db.objectStoreNames.contains(ALBUMS_STORE_NAME)) {
        const albumsStore = db.createObjectStore(ALBUMS_STORE_NAME, {
          keyPath: "id",
          autoIncrement: true,
        });
        albumsStore.createIndex("updatedAt", "updatedAt", { unique: false });
        albumsStore.createIndex("name", "name", { unique: false });
      }

      // 创建相册项（组图-图片关联）存储
      if (!db.objectStoreNames.contains(ALBUM_ITEMS_STORE_NAME)) {
        const albumItemsStore = db.createObjectStore(ALBUM_ITEMS_STORE_NAME, {
          keyPath: "id",
          autoIncrement: true,
        });
        albumItemsStore.createIndex("albumId", "albumId", { unique: false });
        albumItemsStore.createIndex("imageId", "imageId", { unique: false });
        // 复合索引用于唯一性校验（同一图片不可重复加入同一相册）
        albumItemsStore.createIndex("albumId_imageId", ["albumId", "imageId"], {
          unique: true,
        });
        albumItemsStore.createIndex(
          "albumId_sortOrder",
          ["albumId", "sortOrder"],
          { unique: false }
        );
      }

      // 创建回收站存储
      if (!db.objectStoreNames.contains(TRASH_STORE_NAME)) {
        const trashStore = db.createObjectStore(TRASH_STORE_NAME, {
          keyPath: "id",
          autoIncrement: true,
        });
        trashStore.createIndex("deletedAt", "deletedAt", { unique: false });
        trashStore.createIndex("originalImageId", "originalImageId", {
          unique: false,
        });
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

// 确保AI分析日志对象仓库存在（若缺失则触发一次版本升级创建之）
async function ensureAnalysisLogsStoreExists() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME);
    req.onsuccess = () => {
      const db = req.result;
      if (db.objectStoreNames.contains(ANALYSIS_LOGS_STORE_NAME)) {
        db.close();
        resolve();
        return;
      }

      const nextVersion = db.version + 1;
      db.close();

      const upgradeReq = indexedDB.open(DB_NAME, nextVersion);
      upgradeReq.onupgradeneeded = () => {
        const udb = upgradeReq.result;
        if (!udb.objectStoreNames.contains(ANALYSIS_LOGS_STORE_NAME)) {
          const analysisLogsStore = udb.createObjectStore(
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
      upgradeReq.onblocked = () => {
        console.warn("[idb] ensureAnalysisLogsStoreExists upgrade blocked");
      };
      upgradeReq.onsuccess = () => {
        upgradeReq.result.close();
        resolve();
      };
      upgradeReq.onerror = () => reject(upgradeReq.error);
    };
    req.onblocked = () => {
      console.warn("[idb] ensureAnalysisLogsStoreExists open blocked");
    };
    req.onerror = () => reject(req.error);
  });
}

// 确保相册与相册项对象仓库存在
async function ensureAlbumsStoresExist() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME);
    req.onsuccess = () => {
      const db = req.result;
      const needAlbums = !db.objectStoreNames.contains(ALBUMS_STORE_NAME);
      const needAlbumItems = !db.objectStoreNames.contains(
        ALBUM_ITEMS_STORE_NAME
      );
      if (!needAlbums && !needAlbumItems) {
        db.close();
        resolve();
        return;
      }

      const nextVersion = db.version + 1;
      db.close();

      const upgradeReq = indexedDB.open(DB_NAME, nextVersion);
      upgradeReq.onupgradeneeded = () => {
        const udb = upgradeReq.result;
        if (!udb.objectStoreNames.contains(ALBUMS_STORE_NAME)) {
          const albumsStore = udb.createObjectStore(ALBUMS_STORE_NAME, {
            keyPath: "id",
            autoIncrement: true,
          });
          albumsStore.createIndex("updatedAt", "updatedAt", { unique: false });
          albumsStore.createIndex("name", "name", { unique: false });
        }
        if (!udb.objectStoreNames.contains(ALBUM_ITEMS_STORE_NAME)) {
          const albumItemsStore = udb.createObjectStore(
            ALBUM_ITEMS_STORE_NAME,
            {
              keyPath: "id",
              autoIncrement: true,
            }
          );
          albumItemsStore.createIndex("albumId", "albumId", { unique: false });
          albumItemsStore.createIndex("imageId", "imageId", { unique: false });
          albumItemsStore.createIndex(
            "albumId_imageId",
            ["albumId", "imageId"],
            { unique: true }
          );
          albumItemsStore.createIndex(
            "albumId_sortOrder",
            ["albumId", "sortOrder"],
            { unique: false }
          );
        }
      };
      upgradeReq.onblocked = () => {
        console.warn("[idb] ensureAlbumsStoresExist upgrade blocked");
      };
      upgradeReq.onsuccess = () => {
        upgradeReq.result.close();
        resolve();
      };
      upgradeReq.onerror = () => reject(upgradeReq.error);
    };
    req.onblocked = () => {
      console.warn("[idb] ensureAlbumsStoresExist open blocked");
    };
    req.onerror = () => reject(req.error);
  });
}

// ==================== 相册（组图）相关 API ====================
export async function createAlbum(album) {
  await ensureAlbumsStoresExist();
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ALBUMS_STORE_NAME, "readwrite");
    const store = tx.objectStore(ALBUMS_STORE_NAME);
    const now = Date.now();
    const data = {
      name: album.name?.trim() || "未命名相册",
      description: album.description || "",
      coverImageId: album.coverImageId ?? null,
      groupId: album.groupId ?? null,
      itemCount: album.itemCount ?? 0,
      tags: album.tags ? [...album.tags] : [],
      createdAt: album.createdAt || now,
      updatedAt: album.updatedAt || now,
    };
    const req = store.add(data);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getAllAlbums() {
  await ensureAlbumsStoresExist();
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ALBUMS_STORE_NAME, "readonly");
    const store = tx.objectStore(ALBUMS_STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () =>
      resolve(req.result.sort((a, b) => b.updatedAt - a.updatedAt));
    req.onerror = () => reject(req.error);
  });
}

export async function updateAlbum(id, updates) {
  await ensureAlbumsStoresExist();
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ALBUMS_STORE_NAME, "readwrite");
    const store = tx.objectStore(ALBUMS_STORE_NAME);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const existed = getReq.result;
      if (!existed) {
        reject(new Error("Album not found"));
        return;
      }
      const data = { ...existed };
      // 处理计数增量
      if (typeof updates.itemCountDelta === "number") {
        data.itemCount = Math.max(
          0,
          (data.itemCount || 0) + updates.itemCountDelta
        );
      }
      // 其他字段合并
      Object.keys(updates).forEach((k) => {
        if (k === "itemCountDelta") return;
        if (k === "tags") {
          data.tags = updates.tags ? [...updates.tags] : data.tags || [];
        } else {
          data[k] = updates[k];
        }
      });
      data.updatedAt = Date.now();
      const putReq = store.put(data);
      putReq.onsuccess = () => resolve(putReq.result);
      putReq.onerror = () => reject(putReq.error);
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

export async function deleteAlbum(id) {
  await ensureAlbumsStoresExist();
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(
      [ALBUMS_STORE_NAME, ALBUM_ITEMS_STORE_NAME],
      "readwrite"
    );
    const albumsStore = tx.objectStore(ALBUMS_STORE_NAME);
    const itemsStore = tx.objectStore(ALBUM_ITEMS_STORE_NAME);

    // 删除 album_items 内的关联
    const idx = itemsStore.index("albumId");
    const range = IDBKeyRange.only(id);
    const toDelete = [];
    idx.openCursor(range).onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor) {
        toDelete.push(cursor.primaryKey);
        cursor.continue();
      } else {
        toDelete.forEach((pk) => itemsStore.delete(pk));
        // 删除相册本身
        albumsStore.delete(id);
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

// 相册项（图片加入/移除/排序）
export async function addImagesToAlbum(
  albumId,
  imageIds,
  { baseOrder = 0 } = {}
) {
  await ensureAlbumsStoresExist();
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(
      [ALBUMS_STORE_NAME, ALBUM_ITEMS_STORE_NAME],
      "readwrite"
    );
    const albumsStore = tx.objectStore(ALBUMS_STORE_NAME);
    const itemsStore = tx.objectStore(ALBUM_ITEMS_STORE_NAME);

    let added = 0;
    const now = Date.now();

    const addOne = (imageId, index) => {
      const data = {
        albumId,
        imageId,
        sortOrder: baseOrder + (index + 1) * 1000,
        caption: "",
        addedAt: now,
      };
      const req = itemsStore.add(data);
      req.onsuccess = () => {
        added += 1;
      };
      req.onerror = () => {
        // 若违反唯一约束（已存在），忽略即可
        if (req.error && req.error.name === "ConstraintError") {
          return;
        }
      };
    };

    imageIds.forEach((id, i) => addOne(id, i));

    tx.oncomplete = () => {
      // 更新计数与更新时间
      updateAlbum(albumId, { itemCountDelta: added }).finally(resolve);
    };
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function getAlbumItems(albumId) {
  await ensureAlbumsStoresExist();
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ALBUM_ITEMS_STORE_NAME, "readonly");
    const store = tx.objectStore(ALBUM_ITEMS_STORE_NAME);
    const idx = store.index("albumId_sortOrder");
    const range = IDBKeyRange.bound([albumId, -Infinity], [albumId, Infinity]);
    const list = [];
    idx.openCursor(range).onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor) {
        list.push(cursor.value);
        cursor.continue();
      } else {
        resolve(list);
      }
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function removeImageFromAlbum(albumId, imageId) {
  await ensureAlbumsStoresExist();
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(
      [ALBUMS_STORE_NAME, ALBUM_ITEMS_STORE_NAME],
      "readwrite"
    );
    const itemsStore = tx.objectStore(ALBUM_ITEMS_STORE_NAME);
    const idx = itemsStore.index("albumId_imageId");
    idx.get([albumId, imageId]).onsuccess = (e) => {
      const row = e.target.result;
      if (row) {
        itemsStore.delete(row.id);
      }
    };
    tx.oncomplete = () => {
      updateAlbum(albumId, { itemCountDelta: -1 }).finally(resolve);
    };
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function getAlbumsByImageId(imageId) {
  await ensureAlbumsStoresExist();
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ALBUM_ITEMS_STORE_NAME, "readonly");
    const store = tx.objectStore(ALBUM_ITEMS_STORE_NAME);
    const idx = store.index("imageId");
    const range = IDBKeyRange.only(imageId);
    const albumIds = new Set();
    idx.openCursor(range).onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor) {
        albumIds.add(cursor.value.albumId);
        cursor.continue();
      } else {
        resolve(Array.from(albumIds));
      }
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function updateAlbumItem(id, updates) {
  await ensureAlbumsStoresExist();
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ALBUM_ITEMS_STORE_NAME, "readwrite");
    const store = tx.objectStore(ALBUM_ITEMS_STORE_NAME);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const existed = getReq.result;
      if (!existed) {
        reject(new Error("AlbumItem not found"));
        return;
      }
      const data = { ...existed, ...updates };
      const putReq = store.put(data);
      putReq.onsuccess = () => resolve(putReq.result);
      putReq.onerror = () => reject(putReq.error);
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

// 删除图片时的级联清理：供外部在删除图片前调用
export async function cascadeDeleteAlbumItemsByImageId(imageId) {
  await ensureAlbumsStoresExist();
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(
      [ALBUMS_STORE_NAME, ALBUM_ITEMS_STORE_NAME],
      "readwrite"
    );
    const itemsStore = tx.objectStore(ALBUM_ITEMS_STORE_NAME);
    const idx = itemsStore.index("imageId");
    const range = IDBKeyRange.only(imageId);
    const affectedAlbumIds = new Map();
    idx.openCursor(range).onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor) {
        const val = cursor.value;
        affectedAlbumIds.set(
          val.albumId,
          (affectedAlbumIds.get(val.albumId) || 0) + 1
        );
        itemsStore.delete(val.id);
        cursor.continue();
      }
    };
    tx.oncomplete = async () => {
      // 批量更新相册计数，并处理封面回退
      const entries = Array.from(affectedAlbumIds.entries());
      for (const [aid, cnt] of entries) {
        try {
          // 先更新计数
          await updateAlbum(aid, { itemCountDelta: -cnt });
          // 检查封面是否需要回退
          const albums = await getAllAlbums();
          const album = albums.find((a) => a.id === aid);
          if (album && album.coverImageId === imageId) {
            // 找该相册剩余的第一张图片作为新封面
            const items = await getAlbumItems(aid);
            const newCover = items.length > 0 ? items[0].imageId : null;
            await updateAlbum(aid, { coverImageId: newCover });
          }
        } catch (e) {
          console.warn("[idb] update album after cascade failed", e);
        }
      }
      resolve();
    };
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
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
      parentImageId:
        image.parentImageId === null || image.parentImageId === undefined
          ? null
          : image.parentImageId,
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
    req.onsuccess = () => {
      const list = req.result.map((r) => ({
        ...r,
        parentImageId:
          r.parentImageId === null || r.parentImageId === undefined
            ? null
            : r.parentImageId,
      }));
      resolve(list.sort((a, b) => b.createdAt - a.createdAt));
    };
    req.onerror = () => reject(req.error);
  });
}

// 确保 images 表存在 parentImageId 索引（旧库升级）
async function ensureParentIndexOnImages() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME);
    req.onsuccess = () => {
      const db = req.result;
      // 若 images 表不存在，交给 onupgradeneeded 创建
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.close();
        // 触发一次升级创建
        const upgradeReq = indexedDB.open(DB_NAME, db.version + 1);
        upgradeReq.onupgradeneeded = () => {
          const udb = upgradeReq.result;
          if (!udb.objectStoreNames.contains(STORE_NAME)) {
            const store = udb.createObjectStore(STORE_NAME, {
              keyPath: "id",
              autoIncrement: true,
            });
            store.createIndex("createdAt", "createdAt", { unique: false });
            store.createIndex("parentImageId", "parentImageId", {
              unique: false,
            });
          }
        };
        upgradeReq.onsuccess = () => {
          upgradeReq.result.close();
          resolve();
        };
        upgradeReq.onerror = () => reject(upgradeReq.error);
        return;
      }

      // 检查索引是否已存在
      let needUpgrade = false;
      try {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        // 访问索引名；若不存在会抛错
        store.index("parentImageId");
      } catch (e) {
        needUpgrade = true;
      }

      if (!needUpgrade) {
        db.close();
        resolve();
        return;
      }

      const nextVersion = db.version + 1;
      db.close();
      const upgradeReq = indexedDB.open(DB_NAME, nextVersion);
      upgradeReq.onupgradeneeded = (ev) => {
        const tx = upgradeReq.transaction;
        const store = tx.objectStore(STORE_NAME);
        try {
          store.createIndex("parentImageId", "parentImageId", {
            unique: false,
          });
          console.log("[idb] parentImageId index created during upgrade");
        } catch (e) {
          console.warn(
            "[idb] createIndex parentImageId failed (maybe exists)",
            e
          );
        }
      };
      upgradeReq.onsuccess = () => {
        upgradeReq.result.close();
        resolve();
      };
      upgradeReq.onerror = () => reject(upgradeReq.error);
    };
    req.onerror = () => reject(req.error);
    req.onblocked = () => {
      console.warn("[idb] ensureParentIndexOnImages blocked");
    };
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
        parentImageId:
          updates.parentImageId === undefined
            ? existingData.parentImageId ?? null
            : updates.parentImageId ?? null,
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
  // 先级联删除相册关联，并维护计数/封面
  try {
    await cascadeDeleteAlbumItemsByImageId(id);
  } catch (e) {
    console.warn("[idb] cascadeDeleteAlbumItemsByImageId failed", e);
  }

  // 附图模式：若删除的是主图，考虑整组删除（这里采用整组删除策略）
  try {
    const dbForRead = await openDB();
    await new Promise((resolve, reject) => {
      const tx = dbForRead.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(id);
      getReq.onsuccess = async () => {
        const row = getReq.result;
        if (
          row &&
          (row.parentImageId === null || row.parentImageId === undefined)
        ) {
          // 删除其所有附图
          try {
            await detachChildren(id, { deleteChildren: true });
          } catch (e) {
            console.warn("[idb] detachChildren failed", e);
          }
        }
        resolve();
      };
      getReq.onerror = () => reject(getReq.error);
    });
  } catch {}

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ==================== 附图 API ====================
export async function getRootImages() {
  const all = await getAllImages();
  return all.filter((r) => r.parentImageId === null);
}

export async function getChildrenImages(parentId) {
  await ensureParentIndexOnImages();
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const idx = store.index("parentImageId");
    const range = IDBKeyRange.only(parentId);
    const list = [];
    idx.openCursor(range).onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor) {
        list.push(cursor.value);
        cursor.continue();
      } else {
        resolve(list);
      }
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function attachImagesToParent(parentId, imageIds) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    imageIds.forEach((id) => {
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const row = getReq.result;
        if (!row) return;
        const updated = { ...row, parentImageId: parentId };
        // 继承主图的分组与标签需在调用层执行（这里保持轻量）
        store.put(updated);
      };
    });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function detachChildren(
  parentId,
  { deleteChildren = false } = {}
) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const idx = store.index("parentImageId");
    const range = IDBKeyRange.only(parentId);
    const toProcess = [];
    idx.openCursor(range).onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor) {
        toProcess.push(cursor.primaryKey);
        cursor.continue();
      }
    };
    tx.oncomplete = async () => {
      if (deleteChildren) {
        const delDb = await openDB();
        await new Promise((res, rej) => {
          const t = delDb.transaction(STORE_NAME, "readwrite");
          const s = t.objectStore(STORE_NAME);
          toProcess.forEach((pk) => s.delete(pk));
          t.oncomplete = () => res();
          t.onerror = () => rej(t.error);
        });
      } else {
        const updDb = await openDB();
        await new Promise((res, rej) => {
          const t = updDb.transaction(STORE_NAME, "readwrite");
          const s = t.objectStore(STORE_NAME);
          toProcess.forEach(async (pk) => {
            const g = s.get(pk);
            g.onsuccess = () => {
              const row = g.result;
              if (row) s.put({ ...row, parentImageId: null });
            };
          });
          t.oncomplete = () => res();
          t.onerror = () => rej(t.error);
        });
      }
      resolve();
    };
    tx.onerror = () => reject(tx.error);
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
  console.log(`📝 putAnalysisLogs: 准备保存 ${analysisLogs.length} 条日志`);

  // 确保analysis_logs表存在
  await ensureAnalysisLogsStoreExists();
  console.log(`✅ 确保analysis_logs表存在`);

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ANALYSIS_LOGS_STORE_NAME, "readwrite");
    const store = tx.objectStore(ANALYSIS_LOGS_STORE_NAME);

    const promises = analysisLogs.map((log, index) => {
      const logToSave = {
        ...log,
        timestamp:
          log.timestamp instanceof Date
            ? log.timestamp
            : new Date(log.timestamp),
        savedAt: new Date(),
      };

      console.log(`📝 保存日志 ${index + 1}:`, {
        id: logToSave.id,
        imageName: logToSave.imageName,
        status: logToSave.status,
        timestamp: logToSave.timestamp,
      });

      return new Promise((resolveItem, rejectItem) => {
        const req = store.put(logToSave);
        req.onsuccess = () => {
          console.log(`✅ 日志 ${index + 1} 保存成功，ID: ${req.result}`);
          resolveItem(req.result);
        };
        req.onerror = () => {
          console.error(`❌ 日志 ${index + 1} 保存失败:`, req.error);
          rejectItem(req.error);
        };
      });
    });

    Promise.all(promises)
      .then((results) => {
        console.log(`✅ 所有 ${analysisLogs.length} 条日志保存成功`);
        resolve(results);
      })
      .catch((error) => {
        console.error(`❌ 批量保存日志失败:`, error);
        reject(error);
      });
  });
}

/**
 * 获取所有AI分析日志
 * @returns {Promise<Array>} 返回所有分析日志
 */
export async function getAllAnalysisLogs() {
  console.log(`📖 getAllAnalysisLogs: 开始从IndexedDB获取所有AI分析日志`);

  // 确保analysis_logs表存在
  await ensureAnalysisLogsStoreExists();
  console.log(`✅ 确保analysis_logs表存在`);

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

      console.log(
        `📖 getAllAnalysisLogs: 从IndexedDB获取到 ${logs.length} 条日志`
      );
      if (logs.length > 0) {
        console.log(`📖 最新的日志:`, {
          id: logs[0].id,
          imageName: logs[0].imageName,
          status: logs[0].status,
          timestamp: logs[0].timestamp,
        });
      }

      resolve(logs);
    };
    req.onerror = () => {
      console.error(`❌ getAllAnalysisLogs失败:`, req.error);
      reject(req.error);
    };
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

// ==================== 回收站相关方法 ====================

/**
 * 确保回收站存储存在
 */
async function ensureTrashStoreExists() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME);
    req.onsuccess = () => {
      const db = req.result;
      if (db.objectStoreNames.contains(TRASH_STORE_NAME)) {
        db.close();
        resolve();
        return;
      }

      const nextVersion = db.version + 1;
      db.close();

      const upgradeReq = indexedDB.open(DB_NAME, nextVersion);
      upgradeReq.onupgradeneeded = () => {
        const udb = upgradeReq.result;
        if (!udb.objectStoreNames.contains(TRASH_STORE_NAME)) {
          const trashStore = udb.createObjectStore(TRASH_STORE_NAME, {
            keyPath: "id",
            autoIncrement: true,
          });
          trashStore.createIndex("deletedAt", "deletedAt", { unique: false });
          trashStore.createIndex("originalImageId", "originalImageId", {
            unique: false,
          });
        }
      };
      upgradeReq.onblocked = () => {
        console.warn("[idb] ensureTrashStoreExists upgrade blocked");
      };
      upgradeReq.onsuccess = () => {
        upgradeReq.result.close();
        resolve();
      };
      upgradeReq.onerror = () => reject(upgradeReq.error);
    };
    req.onblocked = () => {
      console.warn("[idb] ensureTrashStoreExists open blocked");
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * 将图片移动到回收站
 * @param {Object} image - 要删除的图片对象
 * @returns {Promise<number>} 返回回收站记录ID
 */
export async function moveImageToTrash(image) {
  await ensureTrashStoreExists();
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TRASH_STORE_NAME, "readwrite");
    const store = tx.objectStore(TRASH_STORE_NAME);
    const now = Date.now();

    const trashData = {
      originalImageId: image.id,
      imageData: {
        ...image,
        // 移除可能导致克隆问题的字段
        objectUrl: undefined,
      },
      deletedAt: now,
    };

    const req = store.add(trashData);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * 获取回收站中的所有图片
 * @returns {Promise<Array>} 返回回收站中的图片列表
 */
export async function getTrashImages() {
  await ensureTrashStoreExists();
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TRASH_STORE_NAME, "readonly");
    const store = tx.objectStore(TRASH_STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => {
      const trashItems = req.result.map((item) => ({
        ...item.imageData,
        trashId: item.id,
        originalImageId: item.originalImageId, // 确保 originalImageId 被保留
        deletedAt: item.deletedAt,
        objectUrl:
          item.imageData.blob && item.imageData.blob instanceof Blob
            ? URL.createObjectURL(item.imageData.blob)
            : item.imageData.url,
      }));
      // 按删除时间倒序排列（最新删除的在前）
      trashItems.sort((a, b) => b.deletedAt - a.deletedAt);
      resolve(trashItems);
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * 从回收站恢复组图（主图和所有附图）
 * @param {number} parentTrashId - 主图的回收站记录ID
 * @returns {Promise<Array<number>>} 返回恢复的图片ID数组
 */
async function restoreGroupFromTrash(parentTrashId) {
  await ensureTrashStoreExists();
  const db = await openDB();

  // 获取主图数据
  const parentTrashItem = await new Promise((resolve, reject) => {
    const tx = db.transaction(TRASH_STORE_NAME, "readonly");
    const store = tx.objectStore(TRASH_STORE_NAME);
    const req = store.get(parentTrashId);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  if (!parentTrashItem) {
    throw new Error("Parent trash item not found");
  }

  const parentOriginalId = parentTrashItem.originalImageId;

  // 查找所有相关的回收站项目（主图+附图）
  const allTrashItems = await new Promise((resolve, reject) => {
    const tx = db.transaction(TRASH_STORE_NAME, "readonly");
    const store = tx.objectStore(TRASH_STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => {
      // 筛选出主图和所有附图
      const items = req.result.filter(
        (item) =>
          item.originalImageId === parentOriginalId ||
          item.imageData.parentImageId === parentOriginalId
      );
      resolve(items);
    };
    req.onerror = () => reject(req.error);
  });

  // 恢复所有图片
  const restoredIds = [];
  const newParentId = await restoreSingleImageFromTrash(parentTrashId);
  restoredIds.push(newParentId);

  // 恢复所有附图，并更新它们的parentImageId
  for (const trashItem of allTrashItems) {
    if (trashItem.id !== parentTrashId) {
      const newChildId = await restoreSingleImageFromTrash(trashItem.id);
      // 更新附图的parentImageId
      await updateImage(newChildId, { parentImageId: newParentId });
      restoredIds.push(newChildId);
    }
  }

  return restoredIds;
}

/**
 * 恢复单个图片（内部函数）
 * @param {number} trashId - 回收站记录ID
 * @returns {Promise<number>} 返回恢复的图片ID
 */
async function restoreSingleImageFromTrash(trashId) {
  await ensureTrashStoreExists();
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([TRASH_STORE_NAME, STORE_NAME], "readwrite");
    const trashStore = tx.objectStore(TRASH_STORE_NAME);
    const imageStore = tx.objectStore(STORE_NAME);

    // 从回收站获取图片数据
    const getReq = trashStore.get(trashId);
    getReq.onsuccess = () => {
      const trashItem = getReq.result;
      if (!trashItem) {
        reject(new Error("Trash item not found"));
        return;
      }

      // 恢复图片到主存储
      const imageData = {
        ...trashItem.imageData,
        // 完全移除id字段，让IndexedDB自动生成新的ID
        createdAt: Date.now(),
        // 暂时清空parentImageId，稍后会重新设置
        parentImageId: null,
      };

      // 确保移除id字段
      delete imageData.id;

      const addReq = imageStore.add(imageData);
      addReq.onsuccess = () => {
        // 从回收站删除
        trashStore.delete(trashId);
        resolve(addReq.result);
      };
      addReq.onerror = () => reject(addReq.error);
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

/**
 * 从回收站恢复图片
 * @param {number} trashId - 回收站记录ID
 * @returns {Promise<number>} 返回恢复的图片ID
 */
export async function restoreImageFromTrash(trashId) {
  await ensureTrashStoreExists();
  const db = await openDB();

  // 获取回收站项目数据
  const trashItem = await new Promise((resolve, reject) => {
    const tx = db.transaction(TRASH_STORE_NAME, "readonly");
    const store = tx.objectStore(TRASH_STORE_NAME);
    const req = store.get(trashId);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  if (!trashItem) {
    throw new Error("Trash item not found");
  }

  // 检查是否为主图（没有parentImageId）
  const isParentImage = !trashItem.imageData.parentImageId;

  if (isParentImage) {
    // 如果是主图，恢复整个组图
    const restoredIds = await restoreGroupFromTrash(trashId);
    return restoredIds[0]; // 返回主图ID
  } else {
    // 如果是附图，只恢复这一张图片
    return await restoreSingleImageFromTrash(trashId);
  }
}

/**
 * 批量从回收站恢复图片
 * @param {Array<number>} trashIds - 回收站记录ID数组
 * @returns {Promise<Array<number>>} 返回恢复的图片ID数组
 */
export async function restoreImagesFromTrash(trashIds) {
  const results = [];
  for (const trashId of trashIds) {
    try {
      const imageId = await restoreImageFromTrash(trashId);
      results.push(imageId);
    } catch (error) {
      console.error(`恢复图片失败 (trashId: ${trashId}):`, error);
    }
  }
  return results;
}

/**
 * 从回收站永久删除图片
 * @param {number} trashId - 回收站记录ID
 * @returns {Promise<void>}
 */
export async function permanentlyDeleteFromTrash(trashId) {
  await ensureTrashStoreExists();
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TRASH_STORE_NAME, "readwrite");
    const store = tx.objectStore(TRASH_STORE_NAME);
    const req = store.delete(trashId);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * 批量从回收站永久删除图片
 * @param {Array<number>} trashIds - 回收站记录ID数组
 * @returns {Promise<void>}
 */
export async function permanentlyDeleteFromTrashBatch(trashIds) {
  await ensureTrashStoreExists();
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TRASH_STORE_NAME, "readwrite");
    const store = tx.objectStore(TRASH_STORE_NAME);

    trashIds.forEach((trashId) => {
      store.delete(trashId);
    });

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * 清空回收站
 * @returns {Promise<void>}
 */
export async function clearTrash() {
  await ensureTrashStoreExists();
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TRASH_STORE_NAME, "readwrite");
    const store = tx.objectStore(TRASH_STORE_NAME);
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * 将组图的所有图片（主图和附图）移动到回收站
 * @param {number} parentId - 主图ID
 * @returns {Promise<void>}
 */
async function moveGroupToTrash(parentId) {
  // 获取主图
  const parentImage = await getImageById(parentId);
  if (!parentImage) {
    throw new Error("Parent image not found");
  }

  // 获取所有附图
  const childrenImages = await getChildrenImages(parentId);

  // 将所有图片（主图+附图）移动到回收站
  const allImages = [parentImage, ...childrenImages];

  for (const image of allImages) {
    await moveImageToTrash(image);
  }

  // 从主存储中删除所有图片
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    // 删除主图
    store.delete(parentId);

    // 删除所有附图
    childrenImages.forEach((child) => {
      store.delete(child.id);
    });

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * 修改删除图片的逻辑，将图片移动到回收站而不是直接删除
 * @param {number} id - 图片ID
 * @returns {Promise<void>}
 */
export async function deleteImageToTrash(id) {
  // 先获取图片数据
  const image = await getImageById(id);
  if (!image) {
    throw new Error("Image not found");
  }

  // 先级联删除相册关联，并维护计数/封面
  try {
    await cascadeDeleteAlbumItemsByImageId(id);
  } catch (e) {
    console.warn("[idb] cascadeDeleteAlbumItemsByImageId failed", e);
  }

  // 检查是否为组图的主图
  const isParentImage =
    image.parentImageId === null || image.parentImageId === undefined;

  if (isParentImage) {
    // 如果是主图，将整个组图移动到回收站
    await moveGroupToTrash(id);
  } else {
    // 如果是附图，只移动这一张图片
    await moveImageToTrash(image);

    // 从主存储中删除
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
}
