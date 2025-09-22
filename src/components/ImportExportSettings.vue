<template>
  <div class="import-export-settings">
    <!-- 数据导出区域 -->
    <div class="settings-section">
      <div class="section-header">
        <h4>数据导出</h4>
        <p>导出完整的图片库数据（包含图片文件和元数据）</p>
      </div>

      <div class="export-options">
        <div class="option-item">
          <div class="option-info">
            <h5>导出完整数据</h5>
            <p>
              将所有图片文件和元数据打包为ZIP文件，包含分组信息、图片数据、标签和备注
            </p>
          </div>
          <el-button class="btn-outline" @click="exportCompleteData">
            <el-icon><Download /></el-icon>
            导出完整数据
          </el-button>
        </div>
      </div>
    </div>

    <!-- 数据导入区域 -->
    <div class="settings-section">
      <div class="section-header">
        <h4>数据导入</h4>
        <p>从备份文件恢复完整的图片库数据</p>
      </div>

      <div class="import-options">
        <div class="option-item">
          <div class="option-info">
            <h5>导入完整数据</h5>
            <p>
              从ZIP文件恢复图片文件和元数据，支持完整的数据迁移，包括标签和备注
            </p>
          </div>
          <el-upload
            ref="zipUploadRef"
            :auto-upload="false"
            :show-file-list="false"
            accept=".zip"
            :on-change="handleZipFileChange"
            :before-upload="beforeZipUpload"
          >
            <el-button class="btn-outline">
              <el-icon><Upload /></el-icon>
              选择备份文件
            </el-button>
          </el-upload>
        </div>
      </div>
    </div>

    <!-- 导入选项对话框 -->
    <el-dialog
      v-model="showImportOptions"
      title="导入选项"
      width="500px"
      :close-on-click-modal="false"
    >
      <div class="import-options-dialog">
        <el-form :model="importOptions" label-width="100px">
          <el-form-item label="导入模式">
            <el-radio-group v-model="importOptions.importMode">
              <el-radio value="merge">合并模式（保留现有数据）</el-radio>
              <el-radio value="replace">替换模式（清空现有数据）</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item
            v-if="importOptions.importMode === 'replace'"
            label="确认替换"
          >
            <el-checkbox v-model="importOptions.confirmReplace">
              我确认要清空所有现有数据
            </el-checkbox>
          </el-form-item>

          <el-alert title="注意" type="info" :closable="false" show-icon>
            <p>导入的ZIP文件应包含完整的图片库备份，包括：</p>
            <ul>
              <li>metadata.json - 元数据文件</li>
              <li>images/ - 图片文件夹（按分组组织）</li>
            </ul>
          </el-alert>
        </el-form>
      </div>

      <template #footer>
        <el-button @click="showImportOptions = false">取消</el-button>
        <el-button
          type="primary"
          :disabled="!canConfirmImport"
          @click="confirmImport"
        >
          确认导入
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { ElMessageBox } from "element-plus";
import { Download, Upload } from "@element-plus/icons-vue";
import {
  getAllImages,
  getAllGroups,
  putImage,
  putGroup,
  clearAll,
  clearAllGroups,
} from "@/utils/idb.js";
import JSZip from "jszip";
import { useDrawerNotification } from "@/composables/useDrawerNotification.js";

const props = defineProps({
  groups: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["dataImported", "dataExported"]);

// 使用抽屉式通知
const {
  success,
  error,
  warning,
  info,
  showProgressNotification,
  updateNotificationProgress,
  updateNotificationStatus,
  closeNotification,
} = useDrawerNotification();

// 状态管理
const exporting = ref(false);
const importing = ref(false);
const showImportOptions = ref(false);

// 导入选项
const importOptions = ref({
  importMode: "merge",
  confirmReplace: false,
});

// 文件引用
const zipUploadRef = ref();
const pendingFile = ref(null);

// 计算属性
const canConfirmImport = computed(() => {
  if (importOptions.value.importMode === "replace") {
    return importOptions.value.confirmReplace;
  }
  return true;
});

// 导出完整数据
async function exportCompleteData() {
  try {
    exporting.value = true;

    const images = await getAllImages();
    const groups = await getAllGroups();

    if (images.length === 0) {
      warning("没有数据可以导出");
      return;
    }

    const zip = new JSZip();
    const groupMap = new Map(
      groups.filter((g) => g.id !== -1).map((g) => [g.id, g.name])
    );

    // 创建元数据文件
    const exportData = {
      version: "1.1",
      exportTime: new Date().toISOString(),
      images: images.map((img) => {
        const exportImg = {
          id: img.id,
          name: img.name,
          type: img.type,
          size: img.size,
          groupId: img.groupId || 0,
          createdAt: img.createdAt,
          tags: img.tags || [], // 包含标签数据
          notes: img.notes || "", // 包含备注数据
        };

        // 调试日志
        console.log(`导出图片: ${img.name}`, {
          tags: img.tags,
          notes: img.notes,
          exportTags: exportImg.tags,
        });

        return exportImg;
      }),
      groups: groups
        .filter((group) => group.id !== -1)
        .map((group) => ({
          id: group.id,
          name: group.name,
          description: group.description,
          imageCount: group.imageCount,
          createdAt: group.createdAt,
        })),
      // 确保包含默认的"未分组"分组（如果不存在）
      defaultGroup: {
        id: 0,
        name: "未分组",
        description: "默认分组",
        imageCount: images.filter((img) => !img.groupId || img.groupId === 0)
          .length,
        createdAt: Date.now(),
      },
    };

    // 添加元数据文件到ZIP
    zip.file("metadata.json", JSON.stringify(exportData, null, 2));

    // 创建分组文件夹并添加图片
    const groupFolders = new Map();

    for (const image of images) {
      const groupId = image.groupId || 0;
      const groupName = groupMap.get(groupId) || "未分组";

      if (!groupFolders.has(groupId)) {
        groupFolders.set(groupId, zip.folder(`images/${groupName}`));
      }

      const folder = groupFolders.get(groupId);
      const fileName =
        image.name || `image_${image.id}.${image.type?.split("/")[1] || "jpg"}`;
      folder.file(fileName, image.blob);
    }

    // 生成ZIP文件
    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const a = document.createElement("a");
    a.href = url;
    a.download = `image-gallery-backup-${
      new Date().toISOString().split("T")[0]
    }.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    success(
      `成功导出完整数据：${groups.filter((g) => g.id !== -1).length} 个分组，${
        images.length
      } 张图片`
    );
    emit("dataExported", "complete");
  } catch (err) {
    console.error("导出完整数据失败:", err);
    error("导出完整数据失败");
  } finally {
    exporting.value = false;
  }
}

// 处理ZIP文件选择
function handleZipFileChange(file) {
  pendingFile.value = file;
  showImportOptions.value = true;
}

// ZIP文件上传前检查
function beforeZipUpload(file) {
  if (file.type !== "application/zip" && !file.name.endsWith(".zip")) {
    error("请选择ZIP格式的备份文件");
    return false;
  }
  return true;
}

// 确认导入
async function confirmImport() {
  if (!canConfirmImport.value) return;

  showImportOptions.value = false;

  if (!pendingFile.value) return;

  await importCompleteData(pendingFile.value);
  pendingFile.value = null;
}

// 导入完整数据
async function importCompleteData(file) {
  let progressNotificationId = null;

  try {
    importing.value = true;

    // 显示进度通知
    progressNotificationId = showProgressNotification("正在读取ZIP文件...", {
      title: "导入数据",
      detail: "请稍候，正在处理备份文件",
    });

    // 读取ZIP文件
    const arrayBuffer = await file.raw.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    // 更新进度
    updateNotificationProgress(
      progressNotificationId,
      20,
      "正在解析元数据...",
      "验证备份文件格式"
    );

    // 读取元数据文件
    const metadataFile = zip.file("metadata.json");
    if (!metadataFile) {
      throw new Error("ZIP文件中缺少元数据文件");
    }

    const metadataText = await metadataFile.async("text");
    const data = JSON.parse(metadataText);

    if (!data.images || !data.groups) {
      throw new Error("无效的备份文件格式");
    }

    // 更新进度
    updateNotificationProgress(
      progressNotificationId,
      40,
      "正在验证数据...",
      "检查数据完整性"
    );

    // 替换模式：清空现有数据
    if (importOptions.value.importMode === "replace") {
      await clearAll();
      await clearAllGroups();
    }

    // 更新进度
    updateNotificationProgress(
      progressNotificationId,
      50,
      "正在导入分组...",
      `共 ${data.groups.length} 个分组`
    );

    // 导入分组（包括默认分组）
    const allGroups = [...data.groups];

    // 如果备份文件中有defaultGroup，使用它；否则创建默认分组
    if (data.defaultGroup) {
      allGroups.push(data.defaultGroup);
    } else {
      // 创建默认的"未分组"分组
      allGroups.push({
        id: 0,
        name: "未分组",
        description: "默认分组",
        imageCount: 0,
        createdAt: Date.now(),
      });
    }

    // 合并模式：检查分组名称冲突
    let existingGroups = [];
    if (importOptions.value.importMode === "merge") {
      existingGroups = await getAllGroups();
    }

    for (let i = 0; i < allGroups.length; i++) {
      const group = allGroups[i];

      // 合并模式：检查分组名称冲突，如果存在同名分组则跳过
      if (importOptions.value.importMode === "merge") {
        const hasConflict = existingGroups.some(
          (existingGroup) =>
            existingGroup.name === group.name && existingGroup.id !== group.id
        );

        if (hasConflict) {
          console.log(`跳过重复分组: ${group.name}`);
          continue;
        }
      }

      await putGroup({
        ...group,
        imageCount: 0, // 重置图片数量，稍后重新计算
      });

      // 更新进度
      const progress = 50 + (i / allGroups.length) * 20;
      updateNotificationProgress(
        progressNotificationId,
        progress,
        `正在导入分组 ${i + 1}/${allGroups.length}...`,
        group.name
      );
    }

    // 更新进度
    updateNotificationProgress(
      progressNotificationId,
      70,
      "正在导入图片...",
      `共 ${data.images.length} 张图片`
    );

    // 合并模式：获取现有图片列表用于冲突检测
    let existingImages = [];
    if (importOptions.value.importMode === "merge") {
      existingImages = await getAllImages();
    }

    // 导入图片
    for (let i = 0; i < data.images.length; i++) {
      const imageData = data.images[i];

      // 更新进度
      const progress = 70 + (i / data.images.length) * 25;
      updateNotificationProgress(
        progressNotificationId,
        progress,
        `正在导入图片 ${i + 1}/${data.images.length}...`,
        imageData.name
      );

      // 合并模式：检查图片名称冲突
      if (importOptions.value.importMode === "merge") {
        const hasConflict = existingImages.some(
          (existingImage) =>
            existingImage.name === imageData.name &&
            existingImage.type === imageData.type &&
            existingImage.size === imageData.size
        );

        if (hasConflict) {
          console.log(`跳过重复图片: ${imageData.name}`);
          continue;
        }
      }

      // 查找对应的图片文件
      let groupName = "未分组";
      if (imageData.groupId === 0 || !imageData.groupId) {
        // 未分组图片
        groupName = "未分组";
      } else {
        // 查找分组名称
        const group = data.groups.find((g) => g.id === imageData.groupId);
        if (group) {
          groupName = group.name;
        } else if (
          data.defaultGroup &&
          imageData.groupId === data.defaultGroup.id
        ) {
          groupName = data.defaultGroup.name;
        }
      }

      const imagePath = `images/${groupName}/${imageData.name}`;
      const imageFile = zip.file(imagePath);

      if (imageFile) {
        // 读取图片文件
        const blob = await imageFile.async("blob");

        // 创建图片记录
        const record = {
          name: imageData.name,
          type: imageData.type,
          size: imageData.size,
          blob,
          groupId: imageData.groupId,
          createdAt: imageData.createdAt,
          tags: imageData.tags || [], // 导入标签数据
          notes: imageData.notes || "", // 导入备注数据
        };

        // 调试日志
        console.log(`导入图片: ${imageData.name}`, {
          tags: imageData.tags,
          notes: imageData.notes,
          recordTags: record.tags,
        });

        await putImage(record);
      } else {
        console.warn(`未找到图片文件: ${imagePath}`);
      }
    }

    // 完成导入 - 直接关闭进度通知并显示最终成功消息
    const message =
      importOptions.value.importMode === "merge"
        ? `成功导入完整数据（合并模式）：${data.groups.length} 个分组，${data.images.length} 张图片。重复项目已自动跳过。`
        : `成功导入完整数据（替换模式）：${data.groups.length} 个分组，${data.images.length} 张图片`;

    // 关闭进度通知
    closeNotification(progressNotificationId);

    // 显示最终成功消息
    success(message);
    emit("dataImported", "complete");
  } catch (err) {
    console.error("导入完整数据失败:", err);

    // 关闭进度通知并显示错误消息
    if (progressNotificationId) {
      closeNotification(progressNotificationId);
    }

    error("导入完整数据失败");
  } finally {
    importing.value = false;
  }
}
</script>

<style scoped>
.import-export-settings {
  padding: 0;
}

.settings-section {
  margin-bottom: 32px;
}

.section-header {
  margin-bottom: 20px;
}

.section-header h4 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}

.section-header p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.export-options,
.import-options {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.option-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.option-info {
  flex: 1;
}

.option-info h5 {
  margin: 0 0 4px 0;
  color: #333;
  font-size: 16px;
  font-weight: 500;
}

.option-info p {
  margin: 0;
  color: #666;
  font-size: 14px;
  line-height: 1.4;
}

.import-options-dialog {
  padding: 16px 0;
}

.progress-dialog {
  text-align: center;
}

.progress-text {
  margin: 16px 0 8px 0;
  color: #333;
  font-size: 16px;
  font-weight: 500;
}

.progress-detail {
  margin: 0;
  color: #666;
  font-size: 14px;
}

:deep(.el-upload) {
  display: inline-block;
}

:deep(.el-upload .el-button) {
  margin: 0;
}

/* 自定义按钮样式已移至全局样式 global.css 中的 .btn-outline 类 */
</style>
