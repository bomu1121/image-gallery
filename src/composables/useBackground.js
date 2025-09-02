import { ref, watch } from "vue";
import { ElMessage } from "element-plus";

export function useBackground() {
  const backgroundImage = ref(null);
  const backgroundOpacity = ref(0.3);

  // 背景设置持久化
  function saveBackgroundSettings() {
    if (backgroundImage.value) {
      localStorage.setItem("backgroundImage", backgroundImage.value);
      localStorage.setItem(
        "backgroundOpacity",
        backgroundOpacity.value.toString()
      );
    } else {
      localStorage.removeItem("backgroundImage");
      localStorage.removeItem("backgroundOpacity");
      backgroundImage.value = null;
      backgroundOpacity.value = 0.3;
    }
  }

  function loadBackgroundSettings() {
    const savedImage = localStorage.getItem("backgroundImage");
    const savedOpacity = localStorage.getItem("backgroundOpacity");

    if (savedImage) {
      backgroundImage.value = savedImage;
    }
    if (savedOpacity) {
      backgroundOpacity.value = parseFloat(savedOpacity);
    }
  }

  // 监听透明度变化，自动保存
  watch(backgroundOpacity, () => {
    if (backgroundImage.value) {
      saveBackgroundSettings();
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
      const objectUrl = URL.createObjectURL(blob);

      backgroundImage.value = objectUrl;
      saveBackgroundSettings();

      window.dispatchEvent(new CustomEvent("backgroundSettingsChanged"));
    } catch (e) {
      console.error("背景设置失败:", e);
    }
  }

  function removeBackground() {
    if (backgroundImage.value) {
      URL.revokeObjectURL(backgroundImage.value);
      backgroundImage.value = null;

      saveBackgroundSettings();
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
