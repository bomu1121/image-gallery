# 项目开发必须先看这里

1. 必须先查看 .env 并配置的 VITE_APP_STORAGE_CODE
2. 必须先查看 src/set.js 中的配置
3. 全局引入的 element 图标 使用时添加 Icon- 前缀, 如:

   ```html
   <el-icon><Icon-CircleCloseFilled /></el-icon>
   ```

# 项目语言说明

1. 页面每次初次加载的时候 src/set.js 中自动监测浏览器语言,并作为项目语言的依据
2. src/layout/base-layout/layout-header/header-nav.vue 可进行语言的切换
3. 详细语言配置见 src/plugin/language
4. 目前项目暂时不使用语言切换

# 依赖说明

## vue3-seamless-scroll 无缝滚动

**文档说明地址**

```
https://www.npmjs.com/package/vue3-seamless-scroll
```
