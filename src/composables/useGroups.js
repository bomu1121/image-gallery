import { ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  putImage,
  getAllImages,
  updateImage,
  putGroup,
  getAllGroups,
  updateGroup,
  deleteGroup as deleteGroupFromDB,
} from "@/utils/idb.js";

export function useGroups() {
  const groups = ref([
    { id: 0, name: "未分组", description: "默认分组", imageCount: 0 },
  ]);
  const currentGroupId = ref(0);
  const currentGroupImages = ref([]);
  const newGroup = ref({ name: "", description: "" });
  const editingGroup = ref({ id: null, name: "", description: "" });
  const selectedImageGroupId = ref(0);
  const contextMenuImage = ref(null);

  // 监听分组页面显示状态，自动初始化数据
  watch(
    () => groups.value,
    async (newValue) => {
      if (newValue && currentGroupId.value === 0) {
        await loadGroupImages(0);
      }
    }
  );

  // 分组管理函数
  async function selectGroup(groupId) {
    currentGroupId.value = groupId;
    await loadGroupImages(groupId);
  }

  // 初始化分组数据
  async function initializeGroups() {
    try {
      // 从数据库加载分组数据
      const savedGroups = await getAllGroups();

      // 如果数据库中没有分组数据，创建默认的未分组
      if (savedGroups.length === 0) {
        const defaultGroup = {
          id: 0,
          name: "未分组",
          description: "默认分组",
          imageCount: 0,
        };
        groups.value = [defaultGroup];
        // 保存默认分组到数据库
        await putGroup(defaultGroup);
      } else {
        // 使用数据库中的分组数据
        groups.value = savedGroups;
      }

      // 计算每个分组的图片数量
      const allImages = await getAllImages();
      const groupCounts = {};
      allImages.forEach((img) => {
        const groupId = img.groupId || 0;
        groupCounts[groupId] = (groupCounts[groupId] || 0) + 1;
      });

      // 更新所有分组的图片数量
      groups.value.forEach((group) => {
        group.imageCount = groupCounts[group.id] || 0;
      });

      // 为有图片但没有对应分组的ID创建临时分组
      const existingGroupIds = new Set(groups.value.map((g) => g.id));
      const imageGroupIds = new Set(Object.keys(groupCounts).map(Number));

      imageGroupIds.forEach(async (groupId) => {
        if (!existingGroupIds.has(groupId) && groupId !== 0) {
          const newGroup = {
            id: groupId,
            name: `分组 ${groupId}`,
            description: "自动创建的分组",
            imageCount: groupCounts[groupId],
          };
          groups.value.push(newGroup);
          // 保存新分组到数据库
          await putGroup(newGroup);
        }
      });
    } catch (error) {
      console.error("初始化分组数据失败:", error);
      // 如果出错，至少保证有默认的未分组
      groups.value = [
        { id: 0, name: "未分组", description: "默认分组", imageCount: 0 },
      ];
    }
  }

  async function loadGroupImages(groupId) {
    try {
      const allImages = await getAllImages();

      // 过滤出指定分组的图片
      const groupImages = allImages.filter(
        (img) => (img.groupId || 0) === groupId
      );

      // 为图片创建 objectUrl
      currentGroupImages.value = groupImages.map((img) => ({
        ...img,
        objectUrl: img.blob ? URL.createObjectURL(img.blob) : img.url,
      }));

      // 更新分组的图片数量
      const group = groups.value.find((g) => g.id === groupId);
      if (group) {
        group.imageCount = groupImages.length;
      }
    } catch (error) {
      console.error("加载分组图片失败:", error);
      currentGroupImages.value = [];
    }
  }

  async function createGroup() {
    if (!newGroup.value.name.trim()) {
      ElMessage.warning("请输入分组名称");
      return;
    }

    const group = {
      id: Date.now(),
      name: newGroup.value.name.trim(),
      description: newGroup.value.description.trim(),
      imageCount: 0,
    };

    try {
      // 保存到数据库，获取主键（可能等于传入的 id 或由 IDB 生成）
      const key = await putGroup(group);
      const persistedId = typeof key === "number" ? key : group.id;
      // 用持久化后的 id 规范化对象
      const normalized = { ...group, id: persistedId };
      // 添加到本地状态
      groups.value.push(normalized);
      newGroup.value = { name: "", description: "" };
      ElMessage.success("分组创建成功");
      return normalized.id;
    } catch (error) {
      console.error("创建分组失败:", error);
      ElMessage.error("创建分组失败，请重试");
      return null;
    }
  }

  function showGroupContextMenu(event, group) {
    if (group.id === 0) return; // 未分组不能编辑

    editingGroup.value = { ...group };
  }

  async function updateGroup() {
    if (!editingGroup.value.name.trim()) {
      ElMessage.warning("请输入分组名称");
      return;
    }

    try {
      // 更新数据库
      await updateGroup(editingGroup.value.id, {
        name: editingGroup.value.name.trim(),
        description: editingGroup.value.description.trim(),
      });

      // 更新本地状态
      const index = groups.value.findIndex(
        (g) => g.id === editingGroup.value.id
      );
      if (index !== -1) {
        groups.value[index] = { ...editingGroup.value };
        ElMessage.success("分组更新成功");
      }
    } catch (error) {
      console.error("更新分组失败:", error);
      ElMessage.error("更新分组失败，请重试");
    }
  }

  async function deleteGroup() {
    try {
      await ElMessageBox.confirm(
        "确定要删除这个分组吗？删除后分组内的图片将移动到未分组。",
        "确认删除",
        {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
        }
      );

      const deletedGroup = editingGroup.value;

      // 从数据库删除分组
      await deleteGroupFromDB(deletedGroup.id);

      // 更新本地状态
      const index = groups.value.findIndex((g) => g.id === deletedGroup.id);
      if (index !== -1) {
        // 将删除分组的图片数量添加到未分组
        const ungroupedGroup = groups.value.find((g) => g.id === 0);
        if (ungroupedGroup) {
          ungroupedGroup.imageCount += deletedGroup.imageCount;
        }

        groups.value.splice(index, 1);
        ElMessage.success("分组删除成功");

        if (currentGroupId.value === deletedGroup.id) {
          currentGroupId.value = 0;
          loadGroupImages(0);
        }
      }
    } catch (error) {
      if (error !== "cancel") {
        console.error("删除分组失败:", error);
        ElMessage.error("删除分组失败，请重试");
      }
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
      ElMessage.warning("图片已在当前分组中");
      return;
    }

    try {
      // 更新数据库中的图片分组信息
      await updateImage(contextMenuImage.value.id, { groupId: newGroupId });

      // 更新内存中的图片分组信息
      contextMenuImage.value.groupId = newGroupId;

      // 更新分组图片数量
      const oldGroup = groups.value.find((g) => g.id === oldGroupId);
      const newGroup = groups.value.find((g) => g.id === newGroupId);

      if (oldGroup) {
        oldGroup.imageCount = Math.max(0, oldGroup.imageCount - 1);
      }
      if (newGroup) {
        newGroup.imageCount++;
      }

      ElMessage.success("图片已移动到指定分组");
    } catch (error) {
      console.error("移动图片失败:", error);
      ElMessage.error("移动图片失败，请重试");
    }
  }

  // 文件上传处理
  async function onFileChange(file, targetGroupId = null) {
    try {
      const raw = file.raw;
      if (!raw) return;
      const arrayBuffer = await raw.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: raw.type || "image/*" });
      const record = {
        name: raw.name,
        type: raw.type,
        size: raw.size,
        blob,
        groupId: targetGroupId !== null ? targetGroupId : currentGroupId.value, // 使用指定的分组ID或当前分组ID
      };
      await putImage(record);

      // 更新对应分组的图片数量
      const targetGroup = groups.value.find((g) => g.id === record.groupId);
      if (targetGroup) {
        targetGroup.imageCount++;
      }

      // 如果当前在分组页面且显示的是目标分组，刷新图片显示
      if (currentGroupId.value === record.groupId) {
        await loadGroupImages(record.groupId);
      }

      // 触发图片库刷新事件
      window.dispatchEvent(new CustomEvent("imageAdded"));

      ElMessage.success("图片上传成功");
    } catch (e) {
      console.error("上传失败:", e);
      ElMessage.error("上传失败，请重试");
    }
  }

  // 处理粘贴的图片（与上传类似，但不需要文件对象）
  async function onPasteImages(processedImages, targetGroupId = null) {
    try {
      const groupId =
        targetGroupId !== null ? targetGroupId : currentGroupId.value;

      for (const imageRecord of processedImages) {
        // 设置图片的分组ID
        imageRecord.groupId = groupId;
        await putImage(imageRecord);
      }

      // 更新对应分组的图片数量
      const targetGroup = groups.value.find((g) => g.id === groupId);
      if (targetGroup) {
        targetGroup.imageCount += processedImages.length;
      }

      // 如果当前在分组页面且显示的是目标分组，刷新图片显示
      if (currentGroupId.value === groupId) {
        await loadGroupImages(groupId);
      }

      // 触发图片库刷新事件
      window.dispatchEvent(new CustomEvent("imageAdded"));

      ElMessage.success(`成功粘贴 ${processedImages.length} 张图片`);
    } catch (e) {
      console.error("粘贴失败:", e);
      ElMessage.error("粘贴失败，请重试");
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
  };
}
