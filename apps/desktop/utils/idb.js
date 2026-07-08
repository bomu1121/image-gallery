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
    const req = indexedDB.open(DB_NAME);
    req.onupgradeneeded = (event) => {
      console.log('[idb] upgrade: v' + event.oldVersion + ' -> v' + event.newVersion);
      const db = req.result;
      if (!db.objectStoreNames.contains('images')) { const s = db.createObjectStore('images',{keyPath:'id',autoIncrement:true}); s.createIndex('createdAt','createdAt',{unique:false}); s.createIndex('parentImageId','parentImageId',{unique:false}); }
      if (!db.objectStoreNames.contains('groups')) { const s = db.createObjectStore('groups',{keyPath:'id',autoIncrement:true}); s.createIndex('createdAt','createdAt',{unique:false}); }
      if (!db.objectStoreNames.contains('background')) { const s = db.createObjectStore('background',{keyPath:'id',autoIncrement:true}); s.createIndex('createdAt','createdAt',{unique:false}); }
      if (!db.objectStoreNames.contains('analysis_logs')) { const s = db.createObjectStore('analysis_logs',{keyPath:'id',autoIncrement:true}); s.createIndex('timestamp','timestamp',{unique:false}); s.createIndex('imageName','imageName',{unique:false}); s.createIndex('aiService','aiService',{unique:false}); s.createIndex('status','status',{unique:false}); }
      if (!db.objectStoreNames.contains('albums')) { const s = db.createObjectStore('albums',{keyPath:'id',autoIncrement:true}); s.createIndex('updatedAt','updatedAt',{unique:false}); s.createIndex('name','name',{unique:false}); }
      if (!db.objectStoreNames.contains('album_items')) { const s = db.createObjectStore('album_items',{keyPath:'id',autoIncrement:true}); s.createIndex('albumId','albumId',{unique:false}); s.createIndex('imageId','imageId',{unique:false}); s.createIndex('albumId_imageId',['albumId','imageId'],{unique:true}); s.createIndex('albumId_sortOrder',['albumId','sortOrder'],{unique:false}); }
      if (!db.objectStoreNames.contains('trash')) { db.createObjectStore('trash',{keyPath:'id',autoIncrement:true}); }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}


// 绾喕绻氶崚鍡欑矋鐎电钖勬禒鎾崇氨鐎涙ê婀敍鍫ｅ缂傚搫銇戦崚娆捫曢崣鎴滅濞嗭紕澧楅張顒€宕岀痪褍鍨卞杞扮閿?
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

// 绾喕绻氶懗灞炬珯鐎电钖勬禒鎾崇氨鐎涙ê婀敍鍫ｅ缂傚搫銇戦崚娆捫曢崣鎴滅濞嗭紕澧楅張顒€宕岀痪褍鍨卞杞扮閿?
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

// 绾喕绻欰I閸掑棙鐎介弮銉ョ箶鐎电钖勬禒鎾崇氨鐎涙ê婀敍鍫ｅ缂傚搫銇戦崚娆捫曢崣鎴滅濞嗭紕澧楅張顒€宕岀痪褍鍨卞杞扮閿?
async function ensureAnalysisLogsStoreExists() {
  await openDB();
}

// 绾喕绻氶惄绋垮斀娑撳海娴夐崘宀勩€嶇€电钖勬禒鎾崇氨鐎涙ê婀?
async function ensureAlbumsStoresExist() {
  await openDB();
}

// ==================== 閻╃鍞介敍鍫㈢矋閸ユ拝绱氶惄绋垮彠 API ====================
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
      // 婢跺嫮鎮婄拋鈩冩殶婢х偤鍣?
      if (typeof updates.itemCountDelta === "number") {
        data.itemCount = Math.max(
          0,
          (data.itemCount || 0) + updates.itemCountDelta
        );
      }
      // 閸忔湹绮€涙顔岄崥鍫濊嫙
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

    // 閸掔娀娅?album_items 閸愬懐娈戦崗瀹犱粓
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
        // 閸掔娀娅庨惄绋垮斀閺堫剝闊?
        albumsStore.delete(id);
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

// 閻╃鍞芥い鐧哥礄閸ュ墽澧栭崝鐘插弳/缁夊娅?閹烘帒绨敍?
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
        // 閼汇儴绻氶崣宥呮暜娑撯偓缁撅附娼敍鍫濆嚒鐎涙ê婀敍澶涚礉韫囩晫鏆愰崡鍐插讲
        if (req.error && req.error.name === "ConstraintError") {
          return;
        }
      };
    };

    imageIds.forEach((id, i) => addOne(id, i));

    tx.oncomplete = () => {
      // 閺囧瓨鏌婄拋鈩冩殶娑撳孩娲块弬鐗堟闂?
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

// 閸掔娀娅庨崶鍓у閺冨墎娈戠痪褑浠堝〒鍛倞閿涙矮绶垫径鏍劥閸︺劌鍨归梽銈呮禈閻楀洤澧犵拫鍐暏
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
      // 閹靛綊鍣洪弴瀛樻煀閻╃鍞界拋鈩冩殶閿涘苯鑻熸径鍕倞鐏忎線娼伴崶鐐衡偓鈧?
      const entries = Array.from(affectedAlbumIds.entries());
      for (const [aid, cnt] of entries) {
        try {
          // 閸忓牊娲块弬鎷岊吀閺?
          await updateAlbum(aid, { itemCountDelta: -cnt });
          // 濡偓閺屻儱鐨濋棃銏℃Ц閸氾箓娓剁憰浣告礀闁偓
          const albums = await getAllAlbums();
          const album = albums.find((a) => a.id === aid);
          if (album && album.coverImageId === imageId) {
            // 閹垫崘顕氶惄绋垮斀閸撯晙缍戦惃鍕儑娑撯偓瀵姴娴橀悧鍥︾稊娑撶儤鏌婄亸渚€娼?
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

    // 绾喕绻氶弫鐗堝祦閸欘垯浜掔悮鐛籲dexedDB閸忓娈?
    const data = {
      ...image,
      createdAt: image.createdAt || now,
      parentImageId:
        image.parentImageId === null || image.parentImageId === undefined
          ? null
          : image.parentImageId,
      // 绾喕绻歵ags閺勵垳鍑介弫鎵矋
      tags: image.tags ? [...image.tags] : [],
    };

    // 鐠嬪啳鐦弮銉ョ箶
    console.log(`putImage: ${image.name}`, {
      originalTags: image.tags,
      finalTags: data.tags,
      notes: data.notes,
    });

    // 缁夊娅庨崣顖濆厴鐎佃壈鍤ч崗瀣畷闂傤噣顣介惃鍕摟濞?
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

// 绾喕绻?images 鐞涖劌鐡ㄩ崷?parentImageId 缁便垹绱╅敍鍫熸＋鎼存挸宕岀痪褝绱?
async function ensureParentIndexOnImages() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 3);
    req.onsuccess = () => {
      const db = req.result;
      // 閼?images 鐞涖劋绗夌€涙ê婀敍灞兼唉缂?onupgradeneeded 閸掓稑缂?
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.close();
        // 鐟欙箑褰傛稉鈧▎鈥冲磳缁狙冨灡瀵?
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

      // 濡偓閺屻儳鍌ㄥ鏇熸Ц閸氾箑鍑＄€涙ê婀?
      let needUpgrade = false;
      try {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        // 鐠佸潡妫剁槐銏犵穿閸氬稄绱遍懟銉ょ瑝鐎涙ê婀导姘闁?
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

    // 閸忓牐骞忛崣鏍箛閺堝鏆熼幑?
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const existingData = getReq.result;
      if (!existingData) {
        reject(new Error("Image not found"));
        return;
      }

      // 閸氬牆鑻熼弴瀛樻煀閺佺増宓侀敍宀€鈥樻穱婵囨殶閹诡喖褰叉禒銉潶IndexedDB閸忓娈?
      const updatedData = {
        ...existingData,
        ...updates,
        parentImageId:
          updates.parentImageId === undefined
            ? existingData.parentImageId ?? null
            : updates.parentImageId ?? null,
        // 绾喕绻歵ags閺勵垳鍑介弫鎵矋閿涘奔绗夐崠鍛儓娴犺缍嶆径宥嗘絽鐎电钖?
        tags: updates.tags
          ? [...updates.tags]
          : existingData.tags
          ? [...existingData.tags]
          : [],
      };

      // 缁夊娅庨崣顖濆厴鐎佃壈鍤ч崗瀣畷闂傤噣顣介惃鍕摟濞?
      delete updatedData.objectUrl;

      const putReq = store.put(updatedData);
      putReq.onsuccess = () => resolve(putReq.result);
      putReq.onerror = () => reject(putReq.error);
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

export async function deleteImage(id) {
  // 閸忓牏楠囬懕鏂垮灩闂勩倗娴夐崘灞藉彠閼辨棑绱濋獮鍓佹樊閹躲倛顓搁弫?鐏忎線娼?
  try {
    await cascadeDeleteAlbumItemsByImageId(id);
  } catch (e) {
    console.warn("[idb] cascadeDeleteAlbumItemsByImageId failed", e);
  }

  // 闂勫嫬娴樺Ο鈥崇础閿涙俺瀚㈤崚鐘绘珟閻ㄥ嫭妲告稉璇叉禈閿涘矁鈧啳妾婚弫瀵哥矋閸掔娀娅庨敍鍫ｇ箹闁插矂鍣伴悽銊︽殻缂佸嫬鍨归梽銈囩摜閻ｃ儻绱?
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
          // 閸掔娀娅庨崗鑸靛閺堝妾崶?
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

// ==================== 闂勫嫬娴?API ====================
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
        // 缂佈勫娑撹娴橀惃鍕瀻缂佸嫪绗岄弽鍥╊劮闂団偓閸︺劏鐨熼悽銊ョ湴閹笛嗩攽閿涘牐绻栭柌灞肩箽閹镐浇浜ら柌蹇ョ礆
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
 * 娴犲海绮嶉崶鍙ヨ厬缁夊娅庨崡鏇氶嚋閸ュ墽澧栭敍鍫濈殺闂勫嫬娴橀崣妯硅礋閻欘剛鐝涢崶鍓у閿?
 * @param {number} imageId - 鐟曚胶些闂勩倗娈戦崶鍓уID
 * @returns {Promise<void>}
 */
export async function removeImageFromGroup(imageId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    // 閼惧嘲褰囬崶鍓у娣団剝浼?
    const getReq = store.get(imageId);
    getReq.onsuccess = () => {
      const image = getReq.result;
      if (!image) {
        reject(new Error(""));
        return;
      }

      // 濡偓閺屻儲妲搁崥锔胯礋闂勫嫬娴?
      if (image.parentImageId === null || image.parentImageId === undefined) {
        reject(new Error(""));
        return;
      }

      // 鐏忓敀arentImageId鐠佸墽鐤嗘稉绨剈ll閿涘奔濞囬崗鑸靛灇娑撹櫣瀚粩瀣禈閻?
      const updatedImage = { ...image, parentImageId: null };
      const putReq = store.put(updatedImage);

      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    };

    getReq.onerror = () => reject(getReq.error);
  });
}

/**
 * 鏉╂ê甯弫缈犻嚋缂佸嫬娴橀敍鍫濈殺缂佸嫬娴橀幏鍡楀瀻娑撹櫣瀚粩瀣禈閻楀浄绱?
 * @param {number} parentImageId - 娑撹娴業D
 * @returns {Promise<number>} 鏉╂柨娲栫悮顐ョ箷閸樼喓娈戦崶鍓у閺佷即鍣?
 */
export async function restoreGroupToIndividualImages(parentImageId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    // 閼惧嘲褰囨稉璇叉禈娣団剝浼?
    const getParentReq = store.get(parentImageId);
    getParentReq.onsuccess = () => {
      const parentImage = getParentReq.result;
      if (!parentImage) {
        reject(new Error(""));
        return;
      }

      // 濡偓閺屻儲妲搁崥锔胯礋娑撹娴?
      if (
        parentImage.parentImageId !== null &&
        parentImage.parentImageId !== undefined
      ) {
        reject(new Error(""));
        return;
      }

      // 閺屻儲澹橀幍鈧張澶愭閸?
      const idx = store.index("parentImageId");
      const range = IDBKeyRange.only(parentImageId);
      const childrenToUpdate = [];

      idx.openCursor(range).onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          childrenToUpdate.push(cursor.primaryKey);
          cursor.continue();
        } else {
          // 閹碘偓閺堝妾崶楣冨厴瀹稿弶澹橀崚甯礉瀵偓婵娲块弬?
          let updateCount = 0;
          const totalCount = childrenToUpdate.length;

          if (totalCount === 0) {
            reject(new Error(""));
            return;
          }

          // 閺囧瓨鏌婇幍鈧張澶愭閸ユ拝绱濈亸鍞抋rentImageId鐠佸墽鐤嗘稉绨剈ll
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

// 閸掑棛绮嶉惄绋垮彠閸戣姤鏆?
export async function putGroup(group) {
  await ensureGroupsStoreExists();
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(GROUPS_STORE_NAME, "readwrite");
    const store = tx.objectStore(GROUPS_STORE_NAME);
    const now = Date.now();
    const data = { ...group, createdAt: group.createdAt || now };
    // 娴ｈ法鏁?put 娴犮儱鍚嬬€圭懓鍑＄€涙ê婀稉濠氭暛閿涘牅绶ユ俊鍌炵帛鐠併倕鍨庣紒?id=0閿?
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

    // 閸忓牐骞忛崣鏍箛閺堝鏆熼幑?
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const existingData = getReq.result;
      if (!existingData) {
        reject(new Error("Group not found"));
        return;
      }

      // 閸氬牆鑻熼弴瀛樻煀閺佺増宓侀敍宀€鈥樻穱婵囨殶閹诡喖褰叉禒銉潶IndexedDB閸忓娈?
      const updatedData = { ...existingData, ...updates };

      // 缁夊娅庨崣顖濆厴鐎佃壈鍤ч崗瀣畷闂傤噣顣介惃鍕摟濞?
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

// 閼冲本娅欓崶鍓ф祲閸忓啿鍤遍弫?
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
    // 娴ｈ法鏁?put 娴犮儴顩惄鏍箛閺堝鍎楅弲顖氭禈閿涘牆褰ф穱婵嗙摠娑撯偓瀵姾鍎楅弲顖氭禈閿?
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
    const req = store.get(1); // 閼惧嘲褰?id 娑?1 閻ㄥ嫯鍎楅弲顖氭禈
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
    const req = store.delete(1); // 閸掔娀娅?id 娑?1 閻ㄥ嫯鍎楅弲顖氭禈
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ==================== AI閸掑棙鐎介弮銉ョ箶閻╃鍙ч弬瑙勭《 ====================

/**
 * 娣囨繂鐡ˋI閸掑棙鐎介弮銉ョ箶
 * @param {Object} analysisLog - 閸掑棙鐎介弮銉ョ箶鐎电钖?
 * @returns {Promise<number>} 鏉╂柨娲栨穱婵嗙摠閻ㄥ嫭妫╄箛妗癉
 */
export async function putAnalysisLog(analysisLog) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ANALYSIS_LOGS_STORE_NAME, "readwrite");
    const store = tx.objectStore(ANALYSIS_LOGS_STORE_NAME);

    // 绾喕绻歵imestamp閺勭枍ate鐎电钖?
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
 * 閹靛綊鍣烘穱婵嗙摠AI閸掑棙鐎介弮銉ョ箶
 * @param {Array} analysisLogs - 閸掑棙鐎介弮銉ョ箶閺佹壆绮?
 * @returns {Promise<Array>} 鏉╂柨娲栨穱婵嗙摠閻ㄥ嫭妫╄箛妗癉閺佹壆绮?
 */
export async function putAnalysisLogs(analysisLogs) {
  console.log("");

  // 绾喕绻歛nalysis_logs鐞涖劌鐡ㄩ崷?
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
 * 閼惧嘲褰囬幍鈧張鍫縄閸掑棙鐎介弮銉ョ箶
 * @returns {Promise<Array>} 鏉╂柨娲栭幍鈧張澶婂瀻閺嬫劖妫╄箛?
 */
export async function getAllAnalysisLogs() {
  console.log("");

  // 绾喕绻歛nalysis_logs鐞涖劌鐡ㄩ崷?
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
      // 閹稿妞傞梻瀛樺煈閸婃帒绨幒鎺戝灙閿涘牊娓堕弬鎵畱閸︺劌澧犻敍?
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
 * 閺嶈宓両D閼惧嘲褰嘇I閸掑棙鐎介弮銉ョ箶
 * @param {string} logId - 閺冦儱绻擨D
 * @returns {Promise<Object|null>} 鏉╂柨娲栭崚鍡樼€介弮銉ョ箶閹存潡ull
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
 * 閺嶈宓侀崶鍓у閸氬秶袨閹兼粎鍌ㄩ崚鍡樼€介弮銉ョ箶
 * @param {string} imageName - 閸ュ墽澧栭崥宥囆?
 * @returns {Promise<Array>} 鏉╂柨娲栭崠褰掑帳閻ㄥ嫬鍨庨弸鎰）韫?
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
 * 閺嶈宓丄I閺堝秴濮熼幖婊呭偍閸掑棙鐎介弮銉ョ箶
 * @param {string} aiService - AI閺堝秴濮熼崥宥囆?
 * @returns {Promise<Array>} 鏉╂柨娲栭崠褰掑帳閻ㄥ嫬鍨庨弸鎰）韫?
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
 * 閸掔娀娅嶢I閸掑棙鐎介弮銉ョ箶
 * @param {string} logId - 閺冦儱绻擨D
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
 * 濞撳懐鈹栭幍鈧張鍫縄閸掑棙鐎介弮銉ョ箶
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
 * 閼惧嘲褰囬崚鍡樼€介弮銉ョ箶缂佺喕顓告穱鈩冧紖
 * @returns {Promise<Object>} 鏉╂柨娲栫紒鐔活吀娣団剝浼?
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
    avgDuration: avgDuration / 1000, // 鏉烆剚宕叉稉铏诡潡
    successRate: total > 0 ? ((completed / total) * 100).toFixed(1) : 0,
  };
}

// ==================== 閸ョ偞鏁圭粩娆戞祲閸忚櫕鏌熷▔?====================

/**
 * 绾喕绻氶崶鐐存暪缁旀瑥鐡ㄩ崒銊ョ摠閸?
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
 * 鐏忓棗娴橀悧鍥┬╅崝銊ュ煂閸ョ偞鏁圭粩?
 * @param {Object} image - 鐟曚礁鍨归梽銈囨畱閸ュ墽澧栫€电钖?
 * @returns {Promise<number>} 鏉╂柨娲栭崶鐐存暪缁旀瑨顔囪ぐ鏃綝
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
        // 缁夊娅庨崣顖濆厴鐎佃壈鍤ч崗瀣畷闂傤噣顣介惃鍕摟濞?
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
 * 閼惧嘲褰囬崶鐐存暪缁旀瑤鑵戦惃鍕閺堝娴橀悧?
 * @returns {Promise<Array>} 鏉╂柨娲栭崶鐐存暪缁旀瑤鑵戦惃鍕禈閻楀洤鍨悰?
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
        originalImageId: item.originalImageId, // 绾喕绻?originalImageId 鐞氼偂绻氶悾?
        deletedAt: item.deletedAt,
        objectUrl:
          item.imageData.blob && item.imageData.blob instanceof Blob
            ? URL.createObjectURL(item.imageData.blob)
            : item.imageData.url,
      }));
      // 閹稿鍨归梽銈嗘闂傛潙鈧帒绨幒鎺戝灙閿涘牊娓堕弬鏉垮灩闂勩倗娈戦崷銊ュ閿?
      trashItems.sort((a, b) => b.deletedAt - a.deletedAt);
      resolve(trashItems);
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * 娴犲骸娲栭弨鍓佺彲閹垹顦茬紒鍕禈閿涘牅瀵岄崶鎯ф嫲閹碘偓閺堝妾崶鎾呯礆
 * @param {number} parentTrashId - 娑撹娴橀惃鍕礀閺€鍓佺彲鐠佹澘缍岻D
 * @returns {Promise<Array<number>>} 鏉╂柨娲栭幁銏狀槻閻ㄥ嫬娴橀悧鍢擠閺佹壆绮?
 */
async function restoreGroupFromTrash(parentTrashId) {
  await ensureTrashStoreExists();
  const db = await openDB();

  // 閼惧嘲褰囨稉璇叉禈閺佺増宓?
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

  // 閺屻儲澹橀幍鈧張澶屾祲閸忓磭娈戦崶鐐存暪缁旀瑩銆嶉惄顕嗙礄娑撹娴?闂勫嫬娴橀敍?
  const allTrashItems = await new Promise((resolve, reject) => {
    const tx = db.transaction(TRASH_STORE_NAME, "readonly");
    const store = tx.objectStore(TRASH_STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => {
      // 缁涙盯鈧鍤稉璇叉禈閸滃本澧嶉張澶愭閸?
      const items = req.result.filter(
        (item) =>
          item.originalImageId === parentOriginalId ||
          item.imageData.parentImageId === parentOriginalId
      );
      resolve(items);
    };
    req.onerror = () => reject(req.error);
  });

  // 閹垹顦查幍鈧張澶婃禈閻?
  const restoredIds = [];
  const newParentId = await restoreSingleImageFromTrash(parentTrashId);
  restoredIds.push(newParentId);

  // 閹垹顦查幍鈧張澶愭閸ユ拝绱濋獮鑸垫纯閺傛澘鐣犳禒顒傛畱parentImageId
  for (const trashItem of allTrashItems) {
    if (trashItem.id !== parentTrashId) {
      const newChildId = await restoreSingleImageFromTrash(trashItem.id);
      // 閺囧瓨鏌婇梽鍕禈閻ㄥ埦arentImageId
      await updateImage(newChildId, { parentImageId: newParentId });
      restoredIds.push(newChildId);
    }
  }

  return restoredIds;
}

/**
 * 閹垹顦查崡鏇氶嚋閸ュ墽澧栭敍鍫濆敶闁劌鍤遍弫甯礆
 * @param {number} trashId - 閸ョ偞鏁圭粩娆掝唶瑜版椌D
 * @returns {Promise<number>} 鏉╂柨娲栭幁銏狀槻閻ㄥ嫬娴橀悧鍢擠
 */
async function restoreSingleImageFromTrash(trashId) {
  await ensureTrashStoreExists();
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([TRASH_STORE_NAME, STORE_NAME], "readwrite");
    const trashStore = tx.objectStore(TRASH_STORE_NAME);
    const imageStore = tx.objectStore(STORE_NAME);

    // 娴犲骸娲栭弨鍓佺彲閼惧嘲褰囬崶鍓у閺佺増宓?
    const getReq = trashStore.get(trashId);
    getReq.onsuccess = () => {
      const trashItem = getReq.result;
      if (!trashItem) {
        reject(new Error("Trash item not found"));
        return;
      }

      // 閹垹顦查崶鍓у閸掗瀵岀€涙ê鍋?
      const imageData = {
        ...trashItem.imageData,
        // 鐎瑰苯鍙忕粔濠氭珟id鐎涙顔岄敍宀冾唨IndexedDB閼奉亜濮╅悽鐔稿灇閺傛壆娈慖D
        createdAt: Date.now(),
        // 閺嗗倹妞傚〒鍛敄parentImageId閿涘瞼鈼㈤崥搴濈窗闁插秵鏌婄拋鍓х枂
        parentImageId: null,
      };

      // 绾喕绻氱粔濠氭珟id鐎涙顔?
      delete imageData.id;

      const addReq = imageStore.add(imageData);
      addReq.onsuccess = () => {
        // 娴犲骸娲栭弨鍓佺彲閸掔娀娅?
        trashStore.delete(trashId);
        resolve(addReq.result);
      };
      addReq.onerror = () => reject(addReq.error);
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

/**
 * 娴犲骸娲栭弨鍓佺彲閹垹顦查崶鍓у
 * @param {number} trashId - 閸ョ偞鏁圭粩娆掝唶瑜版椌D
 * @returns {Promise<number>} 鏉╂柨娲栭幁銏狀槻閻ㄥ嫬娴橀悧鍢擠
 */
export async function restoreImageFromTrash(trashId) {
  await ensureTrashStoreExists();
  const db = await openDB();

  // 閼惧嘲褰囬崶鐐存暪缁旀瑩銆嶉惄顔芥殶閹?
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

  // 濡偓閺屻儲妲搁崥锔胯礋娑撹娴橀敍鍫熺梾閺堝「arentImageId閿?
  const isParentImage = !trashItem.imageData.parentImageId;

  if (isParentImage) {
    // 婵″倹鐏夐弰顖欏瘜閸ユ拝绱濋幁銏狀槻閺佺繝閲滅紒鍕禈
    const restoredIds = await restoreGroupFromTrash(trashId);
    return restoredIds[0]; // 鏉╂柨娲栨稉璇叉禈ID
  } else {
    // 婵″倹鐏夐弰顖炴閸ユ拝绱濋崣顏呬划婢跺秷绻栨稉鈧鐘叉禈閻?
    return await restoreSingleImageFromTrash(trashId);
  }
}

/**
 * 閹靛綊鍣烘禒搴℃礀閺€鍓佺彲閹垹顦查崶鍓у
 * @param {Array<number>} trashIds - 閸ョ偞鏁圭粩娆掝唶瑜版椌D閺佹壆绮?
 * @returns {Promise<Array<number>>} 鏉╂柨娲栭幁銏狀槻閻ㄥ嫬娴橀悧鍢擠閺佹壆绮?
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
 * 娴犲骸娲栭弨鍓佺彲濮橀晲绠欓崚鐘绘珟閸ュ墽澧?
 * @param {number} trashId - 閸ョ偞鏁圭粩娆掝唶瑜版椌D
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
 * 閹靛綊鍣烘禒搴℃礀閺€鍓佺彲濮橀晲绠欓崚鐘绘珟閸ュ墽澧?
 * @param {Array<number>} trashIds - 閸ョ偞鏁圭粩娆掝唶瑜版椌D閺佹壆绮?
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
 * 濞撳懐鈹栭崶鐐存暪缁?
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
 * 鐏忓棛绮嶉崶鍓ф畱閹碘偓閺堝娴橀悧鍥风礄娑撹娴橀崪宀勬閸ユ拝绱氱粔璇插З閸掓澘娲栭弨鍓佺彲
 * @param {number} parentId - 娑撹娴業D
 * @returns {Promise<void>}
 */
async function moveGroupToTrash(parentId) {
  // 閼惧嘲褰囨稉璇叉禈
  const parentImage = await getImageById(parentId);
  if (!parentImage) {
    throw new Error("Parent image not found");
  }

  // 閼惧嘲褰囬幍鈧張澶愭閸?
  const childrenImages = await getChildrenImages(parentId);

  // 鐏忓棙澧嶉張澶婃禈閻楀浄绱欐稉璇叉禈+闂勫嫬娴橀敍澶屝╅崝銊ュ煂閸ョ偞鏁圭粩?
  const allImages = [parentImage, ...childrenImages];

  for (const image of allImages) {
    await moveImageToTrash(image);
  }

  // 娴犲簼瀵岀€涙ê鍋嶆稉顓炲灩闂勩倖澧嶉張澶婃禈閻?
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    // 閸掔娀娅庢稉璇叉禈
    store.delete(parentId);

    // 閸掔娀娅庨幍鈧張澶愭閸?
    childrenImages.forEach((child) => {
      store.delete(child.id);
    });

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * 娣囶喗鏁奸崚鐘绘珟閸ュ墽澧栭惃鍕偓鏄忕帆閿涘苯鐨㈤崶鍓у缁夎濮╅崚鏉挎礀閺€鍓佺彲閼板奔绗夐弰顖滄纯閹恒儱鍨归梽?
 * @param {number} id - 閸ュ墽澧朓D
 * @returns {Promise<void>}
 */
export async function deleteImageToTrash(id) {
  // 閸忓牐骞忛崣鏍ф禈閻楀洦鏆熼幑?
  const image = await getImageById(id);
  if (!image) {
    throw new Error("Image not found");
  }

  // 閸忓牏楠囬懕鏂垮灩闂勩倗娴夐崘灞藉彠閼辨棑绱濋獮鍓佹樊閹躲倛顓搁弫?鐏忎線娼?
  try {
    await cascadeDeleteAlbumItemsByImageId(id);
  } catch (e) {
    console.warn("[idb] cascadeDeleteAlbumItemsByImageId failed", e);
  }

  // 濡偓閺屻儲妲搁崥锔胯礋缂佸嫬娴橀惃鍕瘜閸?
  const isParentImage =
    image.parentImageId === null || image.parentImageId === undefined;

  if (isParentImage) {
    // 婵″倹鐏夐弰顖欏瘜閸ユ拝绱濈亸鍡樻殻娑擃亞绮嶉崶鍓╅崝銊ュ煂閸ョ偞鏁圭粩?
    await moveGroupToTrash(id);
  } else {
    // 婵″倹鐏夐弰顖炴閸ユ拝绱濋崣顏喰╅崝銊ㄧ箹娑撯偓瀵姴娴橀悧?
    await moveImageToTrash(image);

    // 娴犲簼瀵岀€涙ê鍋嶆稉顓炲灩闂?
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

