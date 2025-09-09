import { ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { putBackground, getBackground, deleteBackground } from "@/utils/idb.js";

export function useBackground() {
  const backgroundImage = ref(null);
  const backgroundOpacity = ref(0.3);

  // 将 Blob 转换为 base64 字符串
  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // 背景设置持久化
  async function saveBackgroundSettings(imageData = null, mimeType = null) {
    if (imageData || backgroundImage.value) {
      try {
        await putBackground({
          imageData: imageData || backgroundImage.value,
          mimeType: mimeType || "image/*",
          opacity: backgroundOpacity.value,
        });
      } catch (error) {
        console.error("保存背景设置失败:", error);
        ElMessage.error("保存背景设置失败");
      }
    } else {
      try {
        await deleteBackground();
      } catch (error) {
        console.error("删除背景设置失败:", error);
      }
      backgroundImage.value = null;
      backgroundOpacity.value = 0.3;
    }
  }

  async function loadBackgroundSettings() {
    try {
      const backgroundData = await getBackground();
      if (backgroundData && backgroundData.imageData) {
        // 如果存储的是 base64 数据，直接使用
        if (backgroundData.imageData.startsWith("data:")) {
          backgroundImage.value = backgroundData.imageData;
        } else {
          // 如果是旧的 URL 数据，尝试迁移
          backgroundImage.value = backgroundData.imageData;
        }
        backgroundOpacity.value = backgroundData.opacity || 0.3;
      } else {
        // 如果没有找到背景数据，尝试从 localStorage 迁移（兼容旧版本）
        const savedImage = localStorage.getItem("backgroundImage");
        const savedOpacity = localStorage.getItem("backgroundOpacity");

        if (savedImage) {
          backgroundImage.value = savedImage;
          backgroundOpacity.value = savedOpacity
            ? parseFloat(savedOpacity)
            : 0.3;
          // 迁移到 IndexedDB
          await saveBackgroundSettings(savedImage);
          // 清理 localStorage
          localStorage.removeItem("backgroundImage");
          localStorage.removeItem("backgroundOpacity");
        }
      }
    } catch (error) {
      console.error("加载背景设置失败:", error);
    }
  }

  // 监听透明度变化，自动保存
  watch(backgroundOpacity, async () => {
    if (backgroundImage.value) {
      await saveBackgroundSettings();
      window.dispatchEvent(new CustomEvent("backgroundSettingsChanged"));
    }
  });

  // 背景设置相关函数
  async function onBackgroundChange(file) {
    try {
      const raw = file.raw;
      if (!raw) return;

      const arrayBuffer = await raw.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: raw.type || "image/*" });

      // 将 blob 转换为 base64 字符串存储
      const base64 = await blobToBase64(blob);

      // 创建临时 URL 用于显示
      const objectUrl = URL.createObjectURL(blob);
      backgroundImage.value = objectUrl;

      // 保存 base64 数据到 IndexedDB
      await saveBackgroundSettings(base64, blob.type);

      window.dispatchEvent(new CustomEvent("backgroundSettingsChanged"));
    } catch (e) {
      console.error("背景设置失败:", e);
    }
  }

  async function removeBackground() {
    if (backgroundImage.value) {
      URL.revokeObjectURL(backgroundImage.value);
      backgroundImage.value = null;

      await saveBackgroundSettings();
      window.dispatchEvent(new CustomEvent("backgroundSettingsChanged"));
      ElMessage.success("背景图片已移除");
    }
  }

  // 透明度变化处理函数
  function onOpacityChange(value) {
    backgroundOpacity.value = value;
    // watch 会自动触发保存和事件
  }

  return {
    backgroundImage,
    backgroundOpacity,
    saveBackgroundSettings,
    loadBackgroundSettings,
    onBackgroundChange,
    removeBackground,
    onOpacityChange,
  };
}
