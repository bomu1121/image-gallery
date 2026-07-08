import { ref, watch } from "vue";
import { useDrawerNotification } from "@/composables/useDrawerNotification.js";
import { useConfirmDelete } from "@/composables/useConfirmDelete.js";
import {
  putImage,
  getAllImages,
  updateImage,
  putGroup,
  getAllGroups,
  updateGroup as updateGroupInDB,
  deleteGroup as deleteGroupFromDB,
} from "@/utils/idb.js";

export function useGroups() {
  const { success, error, warning, info } = useDrawerNotification();
  const { groupDeleteConfirm } = useConfirmDelete();

  const groups = ref([
    { id: -1, name: "鍏ㄩ儴", description: "鏄剧ず鎵€鏈夊浘鐗?, imageCount: 0 },
    { id: 0, name: "鏈垎缁?, description: "榛樿鍒嗙粍", imageCount: 0 },
  ]);
  const currentGroupId = ref(-1);
  const currentGroupImages = ref([]);
  const newGroup = ref({ name: "", description: "" });
  const editingGroup = ref({ id: null, name: "", description: "" });
  const selectedImageGroupId = ref(0);
  const contextMenuImage = ref(null);

  // 鐩戝惉鍒嗙粍椤甸潰鏄剧ず鐘舵€侊紝鑷姩鍒濆鍖栨暟鎹?
  watch(
    () => groups.value,
    async (newValue) => {
      if (newValue && currentGroupId.value === -1) {
        await loadGroupImages(-1);
      }
    }
  );

  // 鍒嗙粍绠＄悊鍑芥暟
  async function selectGroup(groupId) {
    currentGroupId.value = groupId;
    await loadGroupImages(groupId);
  }

  // 鍒濆鍖栧垎缁勬暟鎹?
  async function initializeGroups() {
    try {
      // 浠庢暟鎹簱鍔犺浇鍒嗙粍鏁版嵁
      const savedGroups = await getAllGroups();

      // 鍒涘缓"鍏ㄩ儴"鍒嗙粍锛堝缁堝瓨鍦紝涓嶄繚瀛樺埌鏁版嵁搴擄級
      const allGroup = {
        id: -1,
        name: "鍏ㄩ儴",
        description: "鏄剧ず鎵€鏈夊浘鐗?,
        imageCount: 0,
      };

      // 濡傛灉鏁版嵁搴撲腑娌℃湁鍒嗙粍鏁版嵁锛屽垱寤洪粯璁ょ殑鏈垎缁?
      if (savedGroups.length === 0) {
        const defaultGroup = {
          id: 0,
          name: "鏈垎缁?,
          description: "榛樿鍒嗙粍",
          imageCount: 0,
        };
        groups.value = [allGroup, defaultGroup];
        // 淇濆瓨榛樿鍒嗙粍鍒版暟鎹簱
        await putGroup(defaultGroup);
      } else {
        // 浣跨敤鏁版嵁搴撲腑鐨勫垎缁勬暟鎹紝骞剁‘淇濇湭鍒嗙粍鎺掑湪绗簩浣嶏紙鍏ㄩ儴鍒嗙粍濮嬬粓绗竴浣嶏級
        const sortedGroups = savedGroups.sort((a, b) => {
          if (a.id === 0) return -1;
          if (b.id === 0) return 1;
          const ao = typeof a.order === "number" ? a.order : a.createdAt || 0;
          const bo = typeof b.order === "number" ? b.order : b.createdAt || 0;
          return ao - bo;
        });
        groups.value = [allGroup, ...sortedGroups];
      }

      // 璁＄畻姣忎釜鍒嗙粍鐨勫浘鐗囨暟閲?
      const allImages = await getAllImages();
      const groupCounts = {};
      allImages.forEach((img) => {
        const groupId = img.groupId || 0;
        groupCounts[groupId] = (groupCounts[groupId] || 0) + 1;
      });

      // 鏇存柊鎵€鏈夊垎缁勭殑鍥剧墖鏁伴噺
      groups.value.forEach((group) => {
        if (group.id === -1) {
          // "鍏ㄩ儴"鍒嗙粍鐨勬暟閲忔槸鎵€鏈夊浘鐗囩殑鎬绘暟
          group.imageCount = allImages.length;
        } else {
          group.imageCount = groupCounts[group.id] || 0;
        }
      });

      // 涓烘湁鍥剧墖浣嗘病鏈夊搴斿垎缁勭殑ID鍒涘缓涓存椂鍒嗙粍
      const existingGroupIds = new Set(groups.value.map((g) => g.id));
      const imageGroupIds = new Set(Object.keys(groupCounts).map(Number));

      imageGroupIds.forEach(async (groupId) => {
        if (!existingGroupIds.has(groupId) && groupId !== 0) {
          const newGroup = {
            id: groupId,
            name: `鍒嗙粍 ${groupId}`,
            description: "鑷姩鍒涘缓鐨勫垎缁?,
            imageCount: groupCounts[groupId],
          };
          groups.value.push(newGroup);
          // 淇濆瓨鏂板垎缁勫埌鏁版嵁搴?
          await putGroup(newGroup);
        }
      });
    } catch (error) {
      console.error("鍒濆鍖栧垎缁勬暟鎹け璐?", error);
      // 濡傛灉鍑洪敊锛岃嚦灏戜繚璇佹湁"鍏ㄩ儴"鍜岄粯璁ょ殑鏈垎缁?
      groups.value = [
        { id: -1, name: "鍏ㄩ儴", description: "鏄剧ず鎵€鏈夊浘鐗?, imageCount: 0 },
        { id: 0, name: "鏈垎缁?, description: "榛樿鍒嗙粍", imageCount: 0 },
      ];
    }
  }

  async function loadGroupImages(groupId) {
    try {
      const allImages = await getAllImages();

      let groupImages;
      if (groupId === -1) {
        // "鍏ㄩ儴"鍒嗙粍锛氭樉绀烘墍鏈夊浘鐗?
        groupImages = allImages;
      } else {
        // 鍏朵粬鍒嗙粍锛氳繃婊ゅ嚭鎸囧畾鍒嗙粍鐨勫浘鐗?
        groupImages = allImages.filter((img) => (img.groupId || 0) === groupId);
      }

      // 涓哄浘鐗囧垱寤?objectUrl
      currentGroupImages.value = groupImages.map((img) => ({
        ...img,
        objectUrl:
          img.blob && img.blob instanceof Blob
            ? URL.createObjectURL(img.blob)
            : img.url,
      }));

      // 鏇存柊鍒嗙粍鐨勫浘鐗囨暟閲?
      const group = groups.value.find((g) => g.id === groupId);
      if (group) {
        if (groupId === -1) {
          // "鍏ㄩ儴"鍒嗙粍鐨勬暟閲忔槸鎵€鏈夊浘鐗囩殑鎬绘暟
          group.imageCount = allImages.length;
        } else {
          group.imageCount = groupImages.length;
        }
      }
    } catch (error) {
      console.error("鍔犺浇鍒嗙粍鍥剧墖澶辫触:", error);
      currentGroupImages.value = [];
    }
  }

  async function createGroup() {
    if (!newGroup.value.name.trim()) {
      warning("璇疯緭鍏ュ垎缁勫悕绉?);
      return;
    }

    const group = {
      id: Date.now(),
      name: newGroup.value.name.trim(),
      description: newGroup.value.description.trim(),
      imageCount: 0,
    };

    try {
      // 淇濆瓨鍒版暟鎹簱锛岃幏鍙栦富閿紙鍙兘绛変簬浼犲叆鐨?id 鎴栫敱 IDB 鐢熸垚锛?
      const key = await putGroup(group);
      const persistedId = typeof key === "number" ? key : group.id;
      // 鐢ㄦ寔涔呭寲鍚庣殑 id 瑙勮寖鍖栧璞?
      const normalized = { ...group, id: persistedId };
      // 娣诲姞鍒版湰鍦扮姸鎬?
      groups.value.push(normalized);
      newGroup.value = { name: "", description: "" };
      success("鍒嗙粍鍒涘缓鎴愬姛");
      return normalized.id;
    } catch (err) {
      console.error("鍒涘缓鍒嗙粍澶辫触:", err);
      error("鍒涘缓鍒嗙粍澶辫触锛岃閲嶈瘯");
      return null;
    }
  }

  function showGroupContextMenu(event, group) {
    if (group.id === 0) return; // 鏈垎缁勪笉鑳界紪杈?

    editingGroup.value = { ...group };
  }

  async function updateGroup() {
    if (!editingGroup.value.name.trim()) {
      warning("璇疯緭鍏ュ垎缁勫悕绉?);
      return;
    }

    try {
      // 鏇存柊鏁版嵁搴?
      await updateGroupInDB(editingGroup.value.id, {
        name: editingGroup.value.name.trim(),
        description: editingGroup.value.description.trim(),
      });

      // 鏇存柊鏈湴鐘舵€?
      const index = groups.value.findIndex(
        (g) => g.id === editingGroup.value.id
      );
      if (index !== -1) {
        groups.value[index] = { ...editingGroup.value };
        success("鍒嗙粍鏇存柊鎴愬姛");
      }
    } catch (err) {
      console.error("鏇存柊鍒嗙粍澶辫触:", err);
      error("鏇存柊鍒嗙粍澶辫触锛岃閲嶈瘯");
    }
  }

  async function deleteGroup() {
    try {
      await groupDeleteConfirm(
        editingGroup.value.name,
        editingGroup.value.imageCount,
        {
          confirmButtonText: "纭畾",
          cancelButtonText: "鍙栨秷",
        }
      );

      const deletedGroup = editingGroup.value;

      // 1. 鍏堝皢璇ュ垎缁勫唴鐨勬墍鏈夊浘鐗囩Щ鍔ㄥ埌鏈垎缁?
      const allImages = await getAllImages();
      const imagesInGroup = allImages.filter(
        (img) => (img.groupId || 0) === deletedGroup.id
      );

      // 鎵归噺鏇存柊鍥剧墖鐨勫垎缁処D涓?锛堟湭鍒嗙粍锛?
      for (const img of imagesInGroup) {
        await updateImage(img.id, { groupId: 0 });
      }

      // 2. 浠庢暟鎹簱鍒犻櫎鍒嗙粍
      await deleteGroupFromDB(deletedGroup.id);

      // 3. 鏇存柊鏈湴鐘舵€?
      const index = groups.value.findIndex((g) => g.id === deletedGroup.id);
      if (index !== -1) {
        // 灏嗗垹闄ゅ垎缁勭殑鍥剧墖鏁伴噺娣诲姞鍒版湭鍒嗙粍
        const ungroupedGroup = groups.value.find((g) => g.id === 0);
        if (ungroupedGroup) {
          ungroupedGroup.imageCount += deletedGroup.imageCount;
        }

        groups.value.splice(index, 1);
        success(`鍒嗙粍鍒犻櫎鎴愬姛锛?{imagesInGroup.length} 寮犲浘鐗囧凡绉诲姩鍒版湭鍒嗙粍`);

        if (currentGroupId.value === deletedGroup.id) {
          currentGroupId.value = 0;
          loadGroupImages(0);
        }
      }
    } catch (err) {
      if (err.message !== "鐢ㄦ埛鍙栨秷") {
        console.error("鍒犻櫎鍒嗙粍澶辫触:", err);
        error("鍒犻櫎鍒嗙粍澶辫触锛岃閲嶈瘯");
      }
    }
  }

  // 閲嶆柊鎺掑簭鍒嗙粍锛堜紶鍏?[{id, order}]锛?
  async function reorderGroups(ordered) {
    try {
      // 鏇存柊鏈湴椤哄簭瀛楁
      const orderMap = new Map(ordered.map((o) => [o.id, o.order]));

      // 纭繚鏈垎缁勭殑order涓?锛屽叾浠栧垎缁勪粠1寮€濮?
      groups.value = groups.value
        .map((g) => ({
          ...g,
          order:
            g.id === 0
              ? 0
              : orderMap.has(g.id)
              ? orderMap.get(g.id) + 1
              : g.order,
        }))
        .sort((a, b) => {
          // 鏈垎缁勫缁堟帓鍦ㄧ涓€浣?
          if (a.id === 0) return -1;
          if (b.id === 0) return 1;
          // 鍏朵粬鍒嗙粍鎸塷rder鎺掑簭
          const ao = typeof a.order === "number" ? a.order : a.createdAt || 0;
          const bo = typeof b.order === "number" ? b.order : b.createdAt || 0;
          return ao - bo;
        });

      // 鎸佷箙鍖栨瘡涓垎缁勭殑 order
      for (const g of groups.value) {
        await updateGroupInDB(g.id, { order: g.order });
      }
    } catch (e) {
      console.error("淇濆瓨鍒嗙粍椤哄簭澶辫触:", e);
      error("淇濆瓨鍒嗙粍椤哄簭澶辫触锛岃閲嶈瘯");
    }
  }

  // 閲嶅懡鍚嶅垎缁?
  async function renameGroup(id, name) {
    try {
      await updateGroupInDB(id, { name: name.trim() });
      const idx = groups.value.findIndex((g) => g.id === id);
      if (idx !== -1) groups.value[idx].name = name.trim();
    } catch (e) {
      console.error("閲嶅懡鍚嶅け璐?", e);
      error("閲嶅懡鍚嶅け璐ワ紝璇烽噸璇?);
    }
  }

  // 鎵归噺鍒犻櫎鍒嗙粍锛堟嫋鎷藉垹闄ゅ尯锛?
  async function bulkDeleteGroups(ids) {
    try {
      let totalMovedImages = 0;

      for (const id of ids) {
        if (id === 0) continue; // 璺宠繃鏈垎缁?

        // 1. 鍏堝皢璇ュ垎缁勫唴鐨勬墍鏈夊浘鐗囩Щ鍔ㄥ埌鏈垎缁?
        const allImages = await getAllImages();
        const imagesInGroup = allImages.filter(
          (img) => (img.groupId || 0) === id
        );

        // 鎵归噺鏇存柊鍥剧墖鐨勫垎缁処D涓?锛堟湭鍒嗙粍锛?
        for (const img of imagesInGroup) {
          await updateImage(img.id, { groupId: 0 });
        }

        totalMovedImages += imagesInGroup.length;

        // 2. 浠庢暟鎹簱鍒犻櫎鍒嗙粍
        await deleteGroupFromDB(id);

        // 3. 浠庢湰鍦扮姸鎬佷腑绉婚櫎鍒嗙粍
        const idx = groups.value.findIndex((g) => g.id === id);
        if (idx !== -1) {
          // 灏嗗垹闄ゅ垎缁勭殑鍥剧墖鏁伴噺娣诲姞鍒版湭鍒嗙粍
          const ungroupedGroup = groups.value.find((g) => g.id === 0);
          if (ungroupedGroup) {
            ungroupedGroup.imageCount += imagesInGroup.length;
          }

          groups.value.splice(idx, 1);
        }
      }

      // 鍒锋柊褰撳墠鍒嗙粍鍥剧墖鏄剧ず
      await loadGroupImages(currentGroupId.value);

      success(`鎵归噺鍒犻櫎鎴愬姛锛?{totalMovedImages} 寮犲浘鐗囧凡绉诲姩鍒版湭鍒嗙粍`);
    } catch (e) {
      console.error("鎵归噺鍒犻櫎鍒嗙粍澶辫触:", e);
      error("鎵归噺鍒犻櫎鍒嗙粍澶辫触锛岃閲嶈瘯");
    }
  }

  function showImageContextMenu(event, img) {
    contextMenuImage.value = img;
    selectedImageGroupId.value = img.groupId || 0;
  }

  function selectImageGroup(groupId) {
    selectedImageGroupId.value = groupId;
  }

  async function moveImageToGroup() {
    if (!contextMenuImage.value) return;

    const oldGroupId = contextMenuImage.value.groupId || 0;
    const newGroupId = selectedImageGroupId.value;

    if (oldGroupId === newGroupId) {
      warning("鍥剧墖宸插湪褰撳墠鍒嗙粍涓?);
      return;
    }

    try {
      // 鏇存柊鏁版嵁搴撲腑鐨勫浘鐗囧垎缁勪俊鎭?
      await updateImage(contextMenuImage.value.id, { groupId: newGroupId });

      // 鏇存柊鍐呭瓨涓殑鍥剧墖鍒嗙粍淇℃伅
      contextMenuImage.value.groupId = newGroupId;

      // 鏇存柊鍒嗙粍鍥剧墖鏁伴噺
      const oldGroup = groups.value.find((g) => g.id === oldGroupId);
      const newGroup = groups.value.find((g) => g.id === newGroupId);

      if (oldGroup) {
        oldGroup.imageCount = Math.max(0, oldGroup.imageCount - 1);
      }
      if (newGroup) {
        newGroup.imageCount++;
      }

      success("鍥剧墖宸茬Щ鍔ㄥ埌鎸囧畾鍒嗙粍");
    } catch (err) {
      console.error("绉诲姩鍥剧墖澶辫触:", err);
      error("绉诲姩鍥剧墖澶辫触锛岃閲嶈瘯");
    }
  }

  // 鏂囦欢涓婁紶澶勭悊
  async function onFileChange(file, targetGroupId = null) {
    console.log("[drag:2] useGroups onFileChange", file?.name, file?.raw?.name);
    try {
      const raw = file.raw;
      if (!raw) return;
      const arrayBuffer = await raw.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: raw.type || "image/*" });
      // 濡傛灉鐩爣鍒嗙粍鏄?鍏ㄩ儴"鍒嗙粍锛屽垯浣跨敤"鏈垎缁?浣滀负瀹為檯瀛樺偍鍒嗙粍
      const actualGroupId =
        targetGroupId !== null ? targetGroupId : currentGroupId.value;
      const finalGroupId = actualGroupId === -1 ? 0 : actualGroupId;

      const record = {
        name: raw.name,
        type: raw.type,
        size: raw.size,
        blob,
        groupId: finalGroupId, // 浣跨敤瀹為檯鐨勫垎缁処D
        createdAt: Date.now(), // 娣诲姞涓婁紶鏃堕棿
        tags: [], // 鍒濆鍖栫┖鐨勬爣绛炬暟缁?
      };
      await putImage(record);

      // 鏇存柊瀵瑰簲鍒嗙粍鐨勫浘鐗囨暟閲?
      const targetGroup = groups.value.find((g) => g.id === record.groupId);
      if (targetGroup) {
        targetGroup.imageCount++;
      }

      // 鏇存柊"鍏ㄩ儴"鍒嗙粍鐨勬暟閲?
      const allGroup = groups.value.find((g) => g.id === -1);
      if (allGroup) {
        allGroup.imageCount++;
      }

      // 濡傛灉褰撳墠鍦ㄥ垎缁勯〉闈笖鏄剧ず鐨勬槸鐩爣鍒嗙粍锛屽埛鏂板浘鐗囨樉绀?
      if (currentGroupId.value === record.groupId) {
        await loadGroupImages(record.groupId);
      }

      // 瑙﹀彂鍥剧墖搴撳埛鏂颁簨浠?
      window.dispatchEvent(new CustomEvent("imageAdded"));

      success("鍥剧墖涓婁紶鎴愬姛");
    } catch (e) {
      console.error("涓婁紶澶辫触:", e);
      error("涓婁紶澶辫触锛岃閲嶈瘯");
    }
  }

  // 澶勭悊绮樿创鐨勫浘鐗囷紙涓庝笂浼犵被浼硷紝浣嗕笉闇€瑕佹枃浠跺璞★級
  async function onPasteImages(
    processedImages,
    targetGroupId = null,
    options = {}
  ) {
    try {
      const actualGroupId =
        targetGroupId !== null ? targetGroupId : currentGroupId.value;
      // 濡傛灉鐩爣鍒嗙粍鏄?鍏ㄩ儴"鍒嗙粍锛屽垯浣跨敤"鏈垎缁?浣滀负瀹為檯瀛樺偍鍒嗙粍
      const finalGroupId = actualGroupId === -1 ? 0 : actualGroupId;

      if (!processedImages || processedImages.length === 0) {
        return;
      }

      if (processedImages.length === 1) {
        const only = { ...processedImages[0], groupId: finalGroupId };
        await putImage(only);
      } else {
        const asAlbum = !!options.asAlbum;
        if (!asAlbum) {
          for (const imageRecord of processedImages) {
            const toInsert = { ...imageRecord, groupId: finalGroupId };
            await putImage(toInsert);
          }
        } else {
          // 澶氬浘绮樿创锛氫互缁勫浘褰㈠紡淇濆瓨锛岄鍥句负涓诲浘锛屽叾浣欎负闄勫浘
          const first = {
            ...processedImages[0],
            groupId: finalGroupId,
            parentImageId: null,
          };
          const parentId = await putImage(first);

          const rest = processedImages.slice(1);
          for (const img of rest) {
            const child = {
              ...img,
              groupId: finalGroupId,
              parentImageId: parentId,
            };
            await putImage(child);
          }
        }
      }

      // 鏇存柊瀵瑰簲鍒嗙粍鐨勫浘鐗囨暟閲?
      const targetGroup = groups.value.find((g) => g.id === finalGroupId);
      if (targetGroup) {
        targetGroup.imageCount += processedImages.length;
      }

      // 鏇存柊"鍏ㄩ儴"鍒嗙粍鐨勬暟閲?
      const allGroup = groups.value.find((g) => g.id === -1);
      if (allGroup) {
        allGroup.imageCount += processedImages.length;
      }

      // 濡傛灉褰撳墠鍦ㄥ垎缁勯〉闈笖鏄剧ず鐨勬槸鐩爣鍒嗙粍锛屽埛鏂板浘鐗囨樉绀?
      if (currentGroupId.value === actualGroupId) {
        await loadGroupImages(actualGroupId);
      }

      // 瑙﹀彂鍥剧墖搴撳埛鏂颁簨浠?
      window.dispatchEvent(new CustomEvent("imageAdded"));

      // success(`鎴愬姛绮樿创 ${processedImages.length} 寮犲浘鐗嘸);
    } catch (e) {
      console.error("绮樿创澶辫触:", e);
      error("绮樿创澶辫触锛岃閲嶈瘯");
    }
  }

  return {
    groups,
    currentGroupId,
    newGroup,
    editingGroup,
    selectedImageGroupId,
    contextMenuImage,
    selectGroup,
    initializeGroups,
    createGroup,
    showGroupContextMenu,
    updateGroup,
    deleteGroup,
    showImageContextMenu,
    selectImageGroup,
    moveImageToGroup,
    onFileChange,
    onPasteImages,
    reorderGroups,
    renameGroup,
    bulkDeleteGroups,
  };
}
