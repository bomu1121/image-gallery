import { ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { putImage, getAllImages, updateImage } from '@/utils/idb.js';

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
  watch(() => groups.value, async (newValue) => {
    if (newValue && currentGroupId.value === 0) {
      await loadGroupImages(0);
    }
  });

  // 分组管理函数
  async function selectGroup(groupId) {
    currentGroupId.value = groupId;
    await loadGroupImages(groupId);
  }

  // 初始化分组数据
  async function initializeGroups() {
    try {
      const allImages = await getAllImages();

      // 计算每个分组的图片数量
      const groupCounts = {};
      allImages.forEach((img) => {
        const groupId = img.groupId || 0;
        groupCounts[groupId] = (groupCounts[groupId] || 0) + 1;
      });

      // 更新分组数据
      groups.value.forEach((group) => {
        group.imageCount = groupCounts[group.id] || 0;
      });
    } catch (error) {
      console.error("初始化分组数据失败:", error);
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

  function createGroup() {
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

    groups.value.push(group);
    newGroup.value = { name: "", description: "" };
    ElMessage.success("分组创建成功");
  }

  function showGroupContextMenu(event, group) {
    if (group.id === 0) return; // 未分组不能编辑

    editingGroup.value = { ...group };
  }

  function updateGroup() {
    if (!editingGroup.value.name.trim()) {
      ElMessage.warning("请输入分组名称");
      return;
    }

    const index = groups.value.findIndex((g) => g.id === editingGroup.value.id);
    if (index !== -1) {
      groups.value[index] = { ...editingGroup.value };
      ElMessage.success("分组更新成功");
    }
  }

  function deleteGroup() {
    ElMessageBox.confirm(
      "确定要删除这个分组吗？删除后分组内的图片将移动到未分组。",
      "确认删除",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }
    )
      .then(() => {
        const deletedGroup = editingGroup.value;
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
      })
      .catch(() => {
        // 用户取消
      });
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

      // 重新加载当前分组的图片
      await loadGroupImages(currentGroupId.value);
    } catch (error) {
      console.error("移动图片失败:", error);
      ElMessage.error("移动图片失败，请重试");
    }
  }

  // 文件上传处理
  async function onFileChange(file) {
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
        groupId: 0, // 新上传的图片默认归类到"未分组"
      };
      await putImage(record);

      // 更新未分组的图片数量
      const ungroupedGroup = groups.value.find((g) => g.id === 0);
      if (ungroupedGroup) {
        ungroupedGroup.imageCount++;
      }

      // 如果当前在分组页面且显示的是未分组，刷新图片显示
      if (currentGroupId.value === 0) {
        await loadGroupImages(0);
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
  async function onPasteImages(processedImages) {
    try {
      for (const imageRecord of processedImages) {
        await putImage(imageRecord);
      }

      // 更新未分组的图片数量
      const ungroupedGroup = groups.value.find((g) => g.id === 0);
      if (ungroupedGroup) {
        ungroupedGroup.imageCount += processedImages.length;
      }

      // 如果当前在分组页面且显示的是未分组，刷新图片显示
      if (currentGroupId.value === 0) {
        await loadGroupImages(0);
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
    currentGroupImages,
    newGroup,
    editingGroup,
    selectedImageGroupId,
    contextMenuImage,
    selectGroup,
    initializeGroups,
    loadGroupImages,
    createGroup,
    showGroupContextMenu,
    updateGroup,
    deleteGroup,
    showImageContextMenu,
    selectImageGroup,
    moveImageToGroup,
    onFileChange,
    onPasteImages
  };
}
