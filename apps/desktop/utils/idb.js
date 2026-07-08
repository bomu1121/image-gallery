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
    // 涓嶆樉寮忔寚瀹氱増鏈紝閬垮厤鍑虹幇鈥滆姹傜増鏈皬浜庣幇鏈夌増鏈€濈殑閿欒
    const request = indexedDB.open(DB_NAME, 3);
  console.log('[idb:debug] openDB v' + request.transaction?.db?.version + ' -> requesting v3');
  request.onupgradeneeded = (event) => {
    console.log('[idb:debug] upgrade: ' + event.oldVersion + ' -> ' + event.newVersion);
    const db = request.result;
    // create stores
    if (!db.objectStoreNames.contains('images')) db.createObjectStore('images',{keyPath:'id',autoIncrement:true});
    if (!db.objectStoreNames.contains('groups')) db.createObjectStore('groups',{keyPath:'id',autoIncrement:true});
    if (!db.objectStoreNames.contains('background')) db.createObjectStore('background',{keyPath:'id',autoIncrement:true});
    if (!db.objectStoreNames.contains('analysis_logs')) db.createObjectStore('analysis_logs',{keyPath:'id',autoIncrement:true});
    if (!db.objectStoreNames.contains('albums')) db.createObjectStore('albums',{keyPath:'id',autoIncrement:true});
    if (!db.objectStoreNames.contains('album_items')) db.createObjectStore('album_items',{keyPath:'id',autoIncrement:true});
    if (!db.objectStoreNames.contains('trash')) db.createObjectStore('trash',{keyPath:'id',autoIncrement:true});
    console.log('[idb:debug] stores created:', Array.from(db.objectStoreNames));
    return;
  };
    ;
    request.onblocked = () => {
      console.warn(
        "[idb] openDB blocked: another connection is preventing upgrade"
      );
    };
    request.onsuccess = () => {
      const db = request.result;
      // 鑻ユ湁鏂扮増鏈崌绾ц姹傦紝涓诲姩鍏抽棴鏃ц繛鎺ワ紝閬垮厤 blocked
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

// 纭繚鍒嗙粍瀵硅薄浠撳簱瀛樺湪锛堣嫢缂哄け鍒欒Е鍙戜竴娆＄増鏈崌绾у垱寤轰箣锛?
async function ensureGroupsStoreExists() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 3);
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

// 纭繚鑳屾櫙瀵硅薄浠撳簱瀛樺湪锛堣嫢缂哄け鍒欒Е鍙戜竴娆＄増鏈崌绾у垱寤轰箣锛?
async function ensureBackgroundStoreExists() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 3);
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

// 纭繚AI鍒嗘瀽鏃ュ織瀵硅薄浠撳簱瀛樺湪锛堣嫢缂哄け鍒欒Е鍙戜竴娆＄増鏈崌绾у垱寤轰箣锛?
async function ensureAnalysisLogsStoreExists() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 3);
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

// 纭繚鐩稿唽涓庣浉鍐岄」瀵硅薄浠撳簱瀛樺湪
async function ensureAlbumsStoresExist() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 3);
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

// ==================== 鐩稿唽锛堢粍鍥撅級鐩稿叧 API ====================
export async function createAlbum(album) {
  await ensureAlbumsStoresExist();
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ALBUMS_STORE_NAME, "readwrite");
    const store = tx.objectStore(ALBUMS_STORE_NAME);
    const now = Date.now();
    const data = {
      name: album.name?.trim() || "",
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
      // 澶勭悊璁℃暟澧為噺
      if (typeof updates.itemCountDelta === "number") {
        data.itemCount = Math.max(
          0,
          (data.itemCount || 0) + updates.itemCountDelta
        );
      }
      // 鍏朵粬瀛楁鍚堝苟
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

    // 鍒犻櫎 album_items 鍐呯殑鍏宠仈
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
        // 鍒犻櫎鐩稿唽鏈韩
        albumsStore.delete(id);
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

// 鐩稿唽椤癸紙鍥剧墖鍔犲叆/绉婚櫎/鎺掑簭锛?
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
        // 鑻ヨ繚鍙嶅敮涓€绾︽潫锛堝凡瀛樺湪锛夛紝蹇界暐鍗冲彲
        if (req.error && req.error.name === "ConstraintError") {
          return;
        }
      };
    };

    imageIds.forEach((id, i) => addOne(id, i));

    tx.oncomplete = () => {
      // 鏇存柊璁℃暟涓庢洿鏂版椂闂?
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

// 鍒犻櫎鍥剧墖鏃剁殑绾ц仈娓呯悊锛氫緵澶栭儴鍦ㄥ垹闄ゅ浘鐗囧墠璋冪敤
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
      // 鎵归噺鏇存柊鐩稿唽璁℃暟锛屽苟澶勭悊灏侀潰鍥為€€
      const entries = Array.from(affectedAlbumIds.entries());
      for (const [aid, cnt] of entries) {
        try {
          // 鍏堟洿鏂拌鏁?
          await updateAlbum(aid, { itemCountDelta: -cnt });
          // 妫€鏌ュ皝闈㈡槸鍚﹂渶瑕佸洖閫€
          const albums = await getAllAlbums();
          const album = albums.find((a) => a.id === aid);
          if (album && album.coverImageId === imageId) {
            // 鎵捐鐩稿唽鍓╀綑鐨勭涓€寮犲浘鐗囦綔涓烘柊灏侀潰
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

    // 纭繚鏁版嵁鍙互琚獻ndexedDB鍏嬮殕
    const data = {
      ...image,
      createdAt: image.createdAt || now,
      parentImageId:
        image.parentImageId === null || image.parentImageId === undefined
          ? null
          : image.parentImageId,
      // 纭繚tags鏄函鏁扮粍
      tags: image.tags ? [...image.tags] : [],
    };

    // 璋冭瘯鏃ュ織
    console.log(`putImage: ${image.name}`, {
      originalTags: image.tags,
      finalTags: data.tags,
      notes: data.notes,
    });

    // 绉婚櫎鍙兘瀵艰嚧鍏嬮殕闂鐨勫瓧娈?
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

// 纭繚 images 琛ㄥ瓨鍦?parentImageId 绱㈠紩锛堟棫搴撳崌绾э級
async function ensureParentIndexOnImages() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 3);
    req.onsuccess = () => {
      const db = req.result;
      // 鑻?images 琛ㄤ笉瀛樺湪锛屼氦缁?onupgradeneeded 鍒涘缓
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.close();
        // 瑙﹀彂涓€娆″崌绾у垱寤?
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

      // 妫€鏌ョ储寮曟槸鍚﹀凡瀛樺湪
      let needUpgrade = false;
      try {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        // 璁块棶绱㈠紩鍚嶏紱鑻ヤ笉瀛樺湪浼氭姏閿?
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

    // 鍏堣幏鍙栫幇鏈夋暟鎹?
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const existingData = getReq.result;
      if (!existingData) {
        reject(new Error("Image not found"));
        return;
      }

      // 鍚堝苟鏇存柊鏁版嵁锛岀‘淇濇暟鎹彲浠ヨIndexedDB鍏嬮殕
      const updatedData = {
        ...existingData,
        ...updates,
        parentImageId:
          updates.parentImageId === undefined
            ? existingData.parentImageId ?? null
            : updates.parentImageId ?? null,
        // 纭繚tags鏄函鏁扮粍锛屼笉鍖呭惈浠讳綍澶嶆潅瀵硅薄
        tags: updates.tags
          ? [...updates.tags]
          : existingData.tags
          ? [...existingData.tags]
          : [],
      };

      // 绉婚櫎鍙兘瀵艰嚧鍏嬮殕闂鐨勫瓧娈?
      delete updatedData.objectUrl;

      const putReq = store.put(updatedData);
      putReq.onsuccess = () => resolve(putReq.result);
      putReq.onerror = () => reject(putReq.error);
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

export async function deleteImage(id) {
  // 鍏堢骇鑱斿垹闄ょ浉鍐屽叧鑱旓紝骞剁淮鎶よ鏁?灏侀潰
  try {
    await cascadeDeleteAlbumItemsByImageId(id);
  } catch (e) {
    console.warn("[idb] cascadeDeleteAlbumItemsByImageId failed", e);
  }

  // 闄勫浘妯″紡锛氳嫢鍒犻櫎鐨勬槸涓诲浘锛岃€冭檻鏁寸粍鍒犻櫎锛堣繖閲岄噰鐢ㄦ暣缁勫垹闄ょ瓥鐣ワ級
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
          // 鍒犻櫎鍏舵墍鏈夐檮鍥?
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

// ==================== 闄勫浘 API ====================
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
        // 缁ф壙涓诲浘鐨勫垎缁勪笌鏍囩闇€鍦ㄨ皟鐢ㄥ眰鎵ц锛堣繖閲屼繚鎸佽交閲忥級
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

/**
 * 浠庣粍鍥句腑绉婚櫎鍗曚釜鍥剧墖锛堝皢闄勫浘鍙樹负鐙珛鍥剧墖锛?
 * @param {number} imageId - 瑕佺Щ闄ょ殑鍥剧墖ID
 * @returns {Promise<void>}
 */
export async function removeImageFromGroup(imageId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    // 鑾峰彇鍥剧墖淇℃伅
    const getReq = store.get(imageId);
    getReq.onsuccess = () => {
      const image = getReq.result;
      if (!image) {
        reject(new Error(""));
        return;
      }

      // 妫€鏌ユ槸鍚︿负闄勫浘
      if (image.parentImageId === null || image.parentImageId === undefined) {
        reject(new Error(""));
        return;
      }

      // 灏唒arentImageId璁剧疆涓簄ull锛屼娇鍏舵垚涓虹嫭绔嬪浘鐗?
      const updatedImage = { ...image, parentImageId: null };
      const putReq = store.put(updatedImage);

      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    };

    getReq.onerror = () => reject(getReq.error);
  });
}

/**
 * 杩樺師鏁翠釜缁勫浘锛堝皢缁勫浘鎷嗗垎涓虹嫭绔嬪浘鐗囷級
 * @param {number} parentImageId - 涓诲浘ID
 * @returns {Promise<number>} 杩斿洖琚繕鍘熺殑鍥剧墖鏁伴噺
 */
export async function restoreGroupToIndividualImages(parentImageId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    // 鑾峰彇涓诲浘淇℃伅
    const getParentReq = store.get(parentImageId);
    getParentReq.onsuccess = () => {
      const parentImage = getParentReq.result;
      if (!parentImage) {
        reject(new Error(""));
        return;
      }

      // 妫€鏌ユ槸鍚︿负涓诲浘
      if (
        parentImage.parentImageId !== null &&
        parentImage.parentImageId !== undefined
      ) {
        reject(new Error("璇ュ浘鐗囦笉鏄富鍥撅紝鏃犳硶杩樺師缁勫浘"));
        return;
      }

      // 鏌ユ壘鎵€鏈夐檮鍥?
      const idx = store.index("parentImageId");
      const range = IDBKeyRange.only(parentImageId);
      const childrenToUpdate = [];

      idx.openCursor(range).onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          childrenToUpdate.push(cursor.primaryKey);
          cursor.continue();
        } else {
          // 鎵€鏈夐檮鍥鹃兘宸叉壘鍒帮紝寮€濮嬫洿鏂?
          let updateCount = 0;
          const totalCount = childrenToUpdate.length;

          if (totalCount === 0) {
            reject(new Error("璇ュ浘鐗囨病鏈夐檮鍥撅紝鏃犳硶杩樺師缁勫浘"));
            return;
          }

          // 鏇存柊鎵€鏈夐檮鍥撅紝灏唒arentImageId璁剧疆涓簄ull
          childrenToUpdate.forEach((childId) => {
            const getChildReq = store.get(childId);
            getChildReq.onsuccess = () => {
              const childImage = getChildReq.result;
              if (childImage) {
                const updatedChild = { ...childImage, parentImageId: null };
                const putReq = store.put(updatedChild);
                putReq.onsuccess = () => {
                  updateCount++;
                  if (updateCount === totalCount) {
                    resolve(totalCount);
                  }
                };
                putReq.onerror = () => reject(putReq.error);
              }
            };
            getChildReq.onerror = () => reject(getChildReq.error);
          });
        }
      };
    };

    getParentReq.onerror = () => reject(getParentReq.error);
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

// 鍒嗙粍鐩稿叧鍑芥暟
export async function putGroup(group) {
  await ensureGroupsStoreExists();
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(GROUPS_STORE_NAME, "readwrite");
    const store = tx.objectStore(GROUPS_STORE_NAME);
    const now = Date.now();
    const data = { ...group, createdAt: group.createdAt || now };
    // 浣跨敤 put 浠ュ吋瀹瑰凡瀛樺湪涓婚敭锛堜緥濡傞粯璁ゅ垎缁?id=0锛?
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

    // 鍏堣幏鍙栫幇鏈夋暟鎹?
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const existingData = getReq.result;
      if (!existingData) {
        reject(new Error("Group not found"));
        return;
      }

      // 鍚堝苟鏇存柊鏁版嵁锛岀‘淇濇暟鎹彲浠ヨIndexedDB鍏嬮殕
      const updatedData = { ...existingData, ...updates };

      // 绉婚櫎鍙兘瀵艰嚧鍏嬮殕闂鐨勫瓧娈?
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

// 鑳屾櫙鍥剧浉鍏冲嚱鏁?
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
    // 浣跨敤 put 浠ヨ鐩栫幇鏈夎儗鏅浘锛堝彧淇濆瓨涓€寮犺儗鏅浘锛?
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
    const req = store.get(1); // 鑾峰彇 id 涓?1 鐨勮儗鏅浘
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
    const req = store.delete(1); // 鍒犻櫎 id 涓?1 鐨勮儗鏅浘
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ==================== AI鍒嗘瀽鏃ュ織鐩稿叧鏂规硶 ====================

/**
 * 淇濆瓨AI鍒嗘瀽鏃ュ織
 * @param {Object} analysisLog - 鍒嗘瀽鏃ュ織瀵硅薄
 * @returns {Promise<number>} 杩斿洖淇濆瓨鐨勬棩蹇桰D
 */
export async function putAnalysisLog(analysisLog) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ANALYSIS_LOGS_STORE_NAME, "readwrite");
    const store = tx.objectStore(ANALYSIS_LOGS_STORE_NAME);

    // 纭繚timestamp鏄疍ate瀵硅薄
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
 * 鎵归噺淇濆瓨AI鍒嗘瀽鏃ュ織
 * @param {Array} analysisLogs - 鍒嗘瀽鏃ュ織鏁扮粍
 * @returns {Promise<Array>} 杩斿洖淇濆瓨鐨勬棩蹇桰D鏁扮粍
 */
export async function putAnalysisLogs(analysisLogs) {
  console.log("");

  // 纭繚analysis_logs琛ㄥ瓨鍦?
  await ensureAnalysisLogsStoreExists();
  console.log("");

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

      console.log("", {
        id: logToSave.id,
        imageName: logToSave.imageName,
        status: logToSave.status,
        timestamp: logToSave.timestamp,
      });

      return new Promise((resolveItem, rejectItem) => {
        const req = store.put(logToSave);
        req.onsuccess = () => {
          console.log("");
          resolveItem(req.result);
        };
        req.onerror = () => {
          console.error("", req.error);
          rejectItem(req.error);
        };
      });
    });

    Promise.all(promises)
      .then((results) => {
        console.log("");
        resolve(results);
      })
      .catch((error) => {
        console.error("", error);
        reject(error);
      });
  });
}

/**
 * 鑾峰彇鎵€鏈堿I鍒嗘瀽鏃ュ織
 * @returns {Promise<Array>} 杩斿洖鎵€鏈夊垎鏋愭棩蹇?
 */
export async function getAllAnalysisLogs() {
  console.log("");

  // 纭繚analysis_logs琛ㄥ瓨鍦?
  await ensureAnalysisLogsStoreExists();
  console.log("");

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
      // 鎸夋椂闂存埑鍊掑簭鎺掑垪锛堟渶鏂扮殑鍦ㄥ墠锛?
      logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      console.log(
        ""
      );
      if (logs.length > 0) {
        console.log("", {
          id: logs[0].id,
          imageName: logs[0].imageName,
          status: logs[0].status,
          timestamp: logs[0].timestamp,
        });
      }

      resolve(logs);
    };
    req.onerror = () => {
      console.error("", req.error);
      reject(req.error);
    };
  });
}

/**
 * 鏍规嵁ID鑾峰彇AI鍒嗘瀽鏃ュ織
 * @param {string} logId - 鏃ュ織ID
 * @returns {Promise<Object|null>} 杩斿洖鍒嗘瀽鏃ュ織鎴杗ull
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
 * 鏍规嵁鍥剧墖鍚嶇О鎼滅储鍒嗘瀽鏃ュ織
 * @param {string} imageName - 鍥剧墖鍚嶇О
 * @returns {Promise<Array>} 杩斿洖鍖归厤鐨勫垎鏋愭棩蹇?
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
 * 鏍规嵁AI鏈嶅姟鎼滅储鍒嗘瀽鏃ュ織
 * @param {string} aiService - AI鏈嶅姟鍚嶇О
 * @returns {Promise<Array>} 杩斿洖鍖归厤鐨勫垎鏋愭棩蹇?
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
 * 鍒犻櫎AI鍒嗘瀽鏃ュ織
 * @param {string} logId - 鏃ュ織ID
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
 * 娓呯┖鎵€鏈堿I鍒嗘瀽鏃ュ織
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
 * 鑾峰彇鍒嗘瀽鏃ュ織缁熻淇℃伅
 * @returns {Promise<Object>} 杩斿洖缁熻淇℃伅
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
    avgDuration: avgDuration / 1000, // 杞崲涓虹
    successRate: total > 0 ? ((completed / total) * 100).toFixed(1) : 0,
  };
}

// ==================== 鍥炴敹绔欑浉鍏虫柟娉?====================

/**
 * 纭繚鍥炴敹绔欏瓨鍌ㄥ瓨鍦?
 */
async function ensureTrashStoreExists() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 3);
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
 * 灏嗗浘鐗囩Щ鍔ㄥ埌鍥炴敹绔?
 * @param {Object} image - 瑕佸垹闄ょ殑鍥剧墖瀵硅薄
 * @returns {Promise<number>} 杩斿洖鍥炴敹绔欒褰旾D
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
        // 绉婚櫎鍙兘瀵艰嚧鍏嬮殕闂鐨勫瓧娈?
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
 * 鑾峰彇鍥炴敹绔欎腑鐨勬墍鏈夊浘鐗?
 * @returns {Promise<Array>} 杩斿洖鍥炴敹绔欎腑鐨勫浘鐗囧垪琛?
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
        originalImageId: item.originalImageId, // 纭繚 originalImageId 琚繚鐣?
        deletedAt: item.deletedAt,
        objectUrl:
          item.imageData.blob && item.imageData.blob instanceof Blob
            ? URL.createObjectURL(item.imageData.blob)
            : item.imageData.url,
      }));
      // 鎸夊垹闄ゆ椂闂村€掑簭鎺掑垪锛堟渶鏂板垹闄ょ殑鍦ㄥ墠锛?
      trashItems.sort((a, b) => b.deletedAt - a.deletedAt);
      resolve(trashItems);
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * 浠庡洖鏀剁珯鎭㈠缁勫浘锛堜富鍥惧拰鎵€鏈夐檮鍥撅級
 * @param {number} parentTrashId - 涓诲浘鐨勫洖鏀剁珯璁板綍ID
 * @returns {Promise<Array<number>>} 杩斿洖鎭㈠鐨勫浘鐗嘔D鏁扮粍
 */
async function restoreGroupFromTrash(parentTrashId) {
  await ensureTrashStoreExists();
  const db = await openDB();

  // 鑾峰彇涓诲浘鏁版嵁
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

  // 鏌ユ壘鎵€鏈夌浉鍏崇殑鍥炴敹绔欓」鐩紙涓诲浘+闄勫浘锛?
  const allTrashItems = await new Promise((resolve, reject) => {
    const tx = db.transaction(TRASH_STORE_NAME, "readonly");
    const store = tx.objectStore(TRASH_STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => {
      // 绛涢€夊嚭涓诲浘鍜屾墍鏈夐檮鍥?
      const items = req.result.filter(
        (item) =>
          item.originalImageId === parentOriginalId ||
          item.imageData.parentImageId === parentOriginalId
      );
      resolve(items);
    };
    req.onerror = () => reject(req.error);
  });

  // 鎭㈠鎵€鏈夊浘鐗?
  const restoredIds = [];
  const newParentId = await restoreSingleImageFromTrash(parentTrashId);
  restoredIds.push(newParentId);

  // 鎭㈠鎵€鏈夐檮鍥撅紝骞舵洿鏂板畠浠殑parentImageId
  for (const trashItem of allTrashItems) {
    if (trashItem.id !== parentTrashId) {
      const newChildId = await restoreSingleImageFromTrash(trashItem.id);
      // 鏇存柊闄勫浘鐨刾arentImageId
      await updateImage(newChildId, { parentImageId: newParentId });
      restoredIds.push(newChildId);
    }
  }

  return restoredIds;
}

/**
 * 鎭㈠鍗曚釜鍥剧墖锛堝唴閮ㄥ嚱鏁帮級
 * @param {number} trashId - 鍥炴敹绔欒褰旾D
 * @returns {Promise<number>} 杩斿洖鎭㈠鐨勫浘鐗嘔D
 */
async function restoreSingleImageFromTrash(trashId) {
  await ensureTrashStoreExists();
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([TRASH_STORE_NAME, STORE_NAME], "readwrite");
    const trashStore = tx.objectStore(TRASH_STORE_NAME);
    const imageStore = tx.objectStore(STORE_NAME);

    // 浠庡洖鏀剁珯鑾峰彇鍥剧墖鏁版嵁
    const getReq = trashStore.get(trashId);
    getReq.onsuccess = () => {
      const trashItem = getReq.result;
      if (!trashItem) {
        reject(new Error("Trash item not found"));
        return;
      }

      // 鎭㈠鍥剧墖鍒颁富瀛樺偍
      const imageData = {
        ...trashItem.imageData,
        // 瀹屽叏绉婚櫎id瀛楁锛岃IndexedDB鑷姩鐢熸垚鏂扮殑ID
        createdAt: Date.now(),
        // 鏆傛椂娓呯┖parentImageId锛岀◢鍚庝細閲嶆柊璁剧疆
        parentImageId: null,
      };

      // 纭繚绉婚櫎id瀛楁
      delete imageData.id;

      const addReq = imageStore.add(imageData);
      addReq.onsuccess = () => {
        // 浠庡洖鏀剁珯鍒犻櫎
        trashStore.delete(trashId);
        resolve(addReq.result);
      };
      addReq.onerror = () => reject(addReq.error);
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

/**
 * 浠庡洖鏀剁珯鎭㈠鍥剧墖
 * @param {number} trashId - 鍥炴敹绔欒褰旾D
 * @returns {Promise<number>} 杩斿洖鎭㈠鐨勫浘鐗嘔D
 */
export async function restoreImageFromTrash(trashId) {
  await ensureTrashStoreExists();
  const db = await openDB();

  // 鑾峰彇鍥炴敹绔欓」鐩暟鎹?
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

  // 妫€鏌ユ槸鍚︿负涓诲浘锛堟病鏈塸arentImageId锛?
  const isParentImage = !trashItem.imageData.parentImageId;

  if (isParentImage) {
    // 濡傛灉鏄富鍥撅紝鎭㈠鏁翠釜缁勫浘
    const restoredIds = await restoreGroupFromTrash(trashId);
    return restoredIds[0]; // 杩斿洖涓诲浘ID
  } else {
    // 濡傛灉鏄檮鍥撅紝鍙仮澶嶈繖涓€寮犲浘鐗?
    return await restoreSingleImageFromTrash(trashId);
  }
}

/**
 * 鎵归噺浠庡洖鏀剁珯鎭㈠鍥剧墖
 * @param {Array<number>} trashIds - 鍥炴敹绔欒褰旾D鏁扮粍
 * @returns {Promise<Array<number>>} 杩斿洖鎭㈠鐨勫浘鐗嘔D鏁扮粍
 */
export async function restoreImagesFromTrash(trashIds) {
  const results = [];
  for (const trashId of trashIds) {
    try {
      const imageId = await restoreImageFromTrash(trashId);
      results.push(imageId);
    } catch (error) {
      console.error("", error);
    }
  }
  return results;
}

/**
 * 浠庡洖鏀剁珯姘镐箙鍒犻櫎鍥剧墖
 * @param {number} trashId - 鍥炴敹绔欒褰旾D
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
 * 鎵归噺浠庡洖鏀剁珯姘镐箙鍒犻櫎鍥剧墖
 * @param {Array<number>} trashIds - 鍥炴敹绔欒褰旾D鏁扮粍
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
 * 娓呯┖鍥炴敹绔?
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
 * 灏嗙粍鍥剧殑鎵€鏈夊浘鐗囷紙涓诲浘鍜岄檮鍥撅級绉诲姩鍒板洖鏀剁珯
 * @param {number} parentId - 涓诲浘ID
 * @returns {Promise<void>}
 */
async function moveGroupToTrash(parentId) {
  // 鑾峰彇涓诲浘
  const parentImage = await getImageById(parentId);
  if (!parentImage) {
    throw new Error("Parent image not found");
  }

  // 鑾峰彇鎵€鏈夐檮鍥?
  const childrenImages = await getChildrenImages(parentId);

  // 灏嗘墍鏈夊浘鐗囷紙涓诲浘+闄勫浘锛夌Щ鍔ㄥ埌鍥炴敹绔?
  const allImages = [parentImage, ...childrenImages];

  for (const image of allImages) {
    await moveImageToTrash(image);
  }

  // 浠庝富瀛樺偍涓垹闄ゆ墍鏈夊浘鐗?
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    // 鍒犻櫎涓诲浘
    store.delete(parentId);

    // 鍒犻櫎鎵€鏈夐檮鍥?
    childrenImages.forEach((child) => {
      store.delete(child.id);
    });

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * 淇敼鍒犻櫎鍥剧墖鐨勯€昏緫锛屽皢鍥剧墖绉诲姩鍒板洖鏀剁珯鑰屼笉鏄洿鎺ュ垹闄?
 * @param {number} id - 鍥剧墖ID
 * @returns {Promise<void>}
 */
export async function deleteImageToTrash(id) {
  // 鍏堣幏鍙栧浘鐗囨暟鎹?
  const image = await getImageById(id);
  if (!image) {
    throw new Error("Image not found");
  }

  // 鍏堢骇鑱斿垹闄ょ浉鍐屽叧鑱旓紝骞剁淮鎶よ鏁?灏侀潰
  try {
    await cascadeDeleteAlbumItemsByImageId(id);
  } catch (e) {
    console.warn("[idb] cascadeDeleteAlbumItemsByImageId failed", e);
  }

  // 妫€鏌ユ槸鍚︿负缁勫浘鐨勪富鍥?
  const isParentImage =
    image.parentImageId === null || image.parentImageId === undefined;

  if (isParentImage) {
    // 濡傛灉鏄富鍥撅紝灏嗘暣涓粍鍥剧Щ鍔ㄥ埌鍥炴敹绔?
    await moveGroupToTrash(id);
  } else {
    // 濡傛灉鏄檮鍥撅紝鍙Щ鍔ㄨ繖涓€寮犲浘鐗?
    await moveImageToTrash(image);

    // 浠庝富瀛樺偍涓垹闄?
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

