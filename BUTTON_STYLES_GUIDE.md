# 全局按钮样式使用指南

## 概述

项目已统一按钮样式，提供了一致的视觉体验和交互效果。

## 可用样式

### `.btn-outline` - 蓝色主题轮廓按钮（推荐）

这是项目的主要按钮样式，适用于主要操作和重要功能。

#### 样式特点：

- **常态**：白色背景，蓝色边框和文字
- **悬停**：淡蓝色背景（4%透明度）
- **焦点**：蓝色外发光效果
- **激活**：淡蓝色背景
- **禁用**：灰色背景和文字

### `.btn-outline-gray` - 灰色主题轮廓按钮

适用于次要操作、重置、取消等非主要功能按钮。

#### 样式特点：

- **常态**：白色背景，灰色边框和文字
- **悬停**：淡灰色背景（4%透明度），深灰色边框和文字
- **焦点**：深灰色外发光效果
- **激活**：淡灰色背景
- **禁用**：灰色背景和文字

#### 使用方法：

##### 1. Element Plus 按钮

```vue
<template>
  <el-button class="btn-outline" @click="handleClick">
    <el-icon><Download /></el-icon>
    按钮文字
  </el-button>
</template>
```

##### 2. 原生按钮

```vue
<template>
  <button class="btn-outline" @click="handleClick">
    <el-icon><Download /></el-icon>
    按钮文字
  </button>
</template>
```

##### 3. 链接样式按钮

```vue
<template>
  <a class="btn-outline" href="#" @click="handleClick">
    <el-icon><Download /></el-icon>
    链接按钮
  </a>
</template>
```

#### 灰色按钮使用方法：

##### 1. Element Plus 按钮

```vue
<template>
  <el-button class="btn-outline-gray" @click="handleReset">
    <el-icon><Refresh /></el-icon>
    重置配置
  </el-button>
</template>
```

##### 2. 原生按钮

```vue
<template>
  <button class="btn-outline-gray" @click="handleCancel">
    <el-icon><Close /></el-icon>
    取消
  </button>
</template>
```

## 自定义变量

如需调整按钮样式，可以修改 `src/style/global.css` 中的 CSS 变量：

```css
:root {
  --btn-primary-color: rgb(0, 122, 255); /* 蓝色主题主色调 */
  --btn-primary-hover-bg: rgba(0, 122, 255, 0.04); /* 蓝色主题悬停背景 */
  --btn-secondary-color: #666666; /* 灰色主题主色调 */
  --btn-secondary-hover-bg: rgba(102, 102, 102, 0.04); /* 灰色主题悬停背景 */
  --btn-secondary-hover-color: #333333; /* 灰色主题悬停文字色 */
  --btn-border-radius: 6px; /* 圆角大小 */
  --btn-padding: 8px 16px; /* 内边距 */
  --btn-font-weight: 500; /* 字体粗细 */
  --btn-transition: all 0.3s ease; /* 过渡动画 */
}
```

## 最佳实践

### 1. 图标使用

- 建议在按钮文字前添加图标
- 使用 Element Plus 的 `el-icon` 组件
- 图标与文字间距为 6px

### 2. 按钮大小

- 使用默认的 `--btn-padding: 8px 16px`
- 如需更大按钮，可添加额外 CSS 类

### 3. 禁用状态

- 使用 `disabled` 属性自动应用禁用样式
- 无需额外 CSS 类

### 4. 按钮样式选择

- **主要操作**：使用 `.btn-outline`（蓝色主题）
  - 保存、确认、提交、导出等
- **次要操作**：使用 `.btn-outline-gray`（灰色主题）
  - 重置、取消、删除等

### 5. 组合使用

```vue
<template>
  <!-- 操作按钮组 -->
  <div class="button-group">
    <el-button class="btn-outline" @click="save">
      <el-icon><Check /></el-icon>
      保存
    </el-button>
    <el-button class="btn-outline-gray" @click="cancel">
      <el-icon><Close /></el-icon>
      取消
    </el-button>
  </template>
</template>

<style scoped>
.button-group {
  display: flex;
  gap: 12px;
  align-items: center;
}
</style>
```

## 注意事项

1. 使用 `!important` 确保样式优先级，覆盖 Element Plus 默认样式
2. 按钮支持所有标准 HTML 属性（disabled、type 等）
3. 样式已包含响应式设计，适配不同屏幕尺寸
4. 如需其他按钮变体，可基于 `.btn-outline` 创建新的 CSS 类

## 示例

参考 `src/components/ImportExportSettings.vue` 中的使用示例。
