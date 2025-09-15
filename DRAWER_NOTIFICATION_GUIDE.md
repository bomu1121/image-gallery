# 抽屉通知组件使用指南

## 概述

项目现在使用统一的抽屉通知组件来替代 Element Plus 的 ElMessage 组件，提供更好的用户体验和一致的视觉风格。

## 基本用法

### 1. 导入通知函数

```javascript
import { useDrawerNotification } from "@/composables/useDrawerNotification.js";

// 在 setup 函数中解构需要的方法
const { success, error, warning, info, showNotification } =
  useDrawerNotification();
```

### 2. 使用便捷方法

```javascript
// 成功通知
success("操作成功！");

// 错误通知
error("操作失败，请重试");

// 警告通知
warning("请注意相关事项");

// 信息通知
info("这是一条信息");
```

### 3. 高级用法

```javascript
// 自定义通知
showNotification({
  type: "success",
  title: "上传完成",
  message: "文件已成功上传到服务器",
  detail: "文件大小: 2.5MB",
  duration: 5000, // 5秒后自动关闭，0表示不自动关闭
  showProgress: true, // 显示进度条
  progress: 100, // 进度百分比
});

// 带进度的通知
const notificationId = showProgressNotification("正在上传文件...", {
  showProgress: true,
  progress: 0,
});

// 更新进度
updateNotificationProgress(notificationId, 50, "上传中...", "已上传 50%");
updateNotificationProgress(notificationId, 100, "上传完成", "文件已保存");

// 更新状态
updateNotificationStatus(notificationId, "success", "上传完成", "文件已保存");
```

## 迁移指南

### 从 ElMessage 迁移

```javascript
// 旧代码
import { ElMessage } from "element-plus";
ElMessage.success("操作成功");
ElMessage.error("操作失败");
ElMessage.warning("警告信息");
ElMessage.info("提示信息");

// 新代码
import { useDrawerNotification } from "@/composables/useDrawerNotification.js";
const { success, error, warning, info } = useDrawerNotification();
success("操作成功");
error("操作失败");
warning("警告信息");
info("提示信息");
```

## 通知类型

- **success**: 成功操作，绿色主题
- **error**: 错误信息，红色主题
- **warning**: 警告信息，黄色主题
- **info**: 一般信息，蓝色主题

## 配置选项

| 参数         | 类型    | 默认值 | 说明                               |
| ------------ | ------- | ------ | ---------------------------------- |
| type         | String  | 'info' | 通知类型                           |
| title        | String  | ''     | 通知标题                           |
| message      | String  | ''     | 通知消息                           |
| detail       | String  | ''     | 详细信息                           |
| duration     | Number  | 0      | 自动关闭时间(ms)，0 表示不自动关闭 |
| showProgress | Boolean | false  | 是否显示进度条                     |
| progress     | Number  | 0      | 进度百分比(0-100)                  |
| closable     | Boolean | true   | 是否可手动关闭                     |

## 动画效果

通知使用抽屉滑入动画，从右侧滑入，提供流畅的视觉体验。

## 注意事项

1. 确保在组件中正确导入和使用 `useDrawerNotification`
2. 避免在同一个 catch 块中同时使用 `error` 变量名和 `error()` 函数
3. 进度通知适合长时间操作，记得在操作完成后关闭通知
4. 通知会自动堆叠显示，无需手动管理位置

## 已迁移的文件

- ✅ `src/App.vue` - 主应用组件
- ✅ `src/views/ImageGallery.vue` - 图片画廊视图
- ✅ `src/composables/useGroups.js` - 分组管理逻辑
- 🔄 其他文件待迁移...

## 待迁移文件列表

- `src/components/CloudSyncSettings.vue`
- `src/components/SyncStatusMonitor.vue`
- `src/composables/useCloudSyncIntegration.js`
- `src/composables/useCloudSync.js`
- `src/components/GroupManageDialog.vue`
- `src/components/ImportExportSettings.vue`

## 使用建议

1. **一致性**: 在所有组件中使用统一的抽屉通知
2. **用户体验**: 合理设置自动关闭时间
3. **信息层次**: 使用 title、message、detail 来组织信息层次
4. **进度反馈**: 长时间操作使用进度通知
5. **错误处理**: 错误通知保持较长的显示时间以便用户阅读
