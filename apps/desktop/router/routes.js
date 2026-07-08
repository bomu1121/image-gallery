// 错误页面
const errorPageRouter = [
  {
    path: "/not-found",
    name: "NotFound",
    component: () => import("@/views/system/not-found.vue"),
    meta: {
      title: "页面未找到",
    },
  },
  {
    path: "/error-page",
    name: "ErrorPage",
    component: () => import("@/views/system/error.vue"),
    meta: {
      title: "系统异常",
    },
  },
];

// 开发与正式环境下都有路由
export const productionRouter = [
  {
    path: "/",
    redirect: "/gallery",
  },
  {
    path: "/gallery",
    name: "ImageGallery",
    component: () => import("@/views/ImageGallery.vue"),
    meta: { title: "图片画廊" },
  },
  {
    path: "/image/:id",
    name: "ImageDetail",
    component: () => import("@/views/ImageDetail.vue"),
    meta: { title: "图片详情" },
  },
  {
    path: "/settings",
    name: "Settings",
    component: () => import("@/components/SettingsPage.vue"),
    meta: { title: "设置" },
  },
  {
    path: "/ai-analysis-logs",
    name: "AIAnalysisLogs",
    component: () => import("@/views/AIAnalysisLogs.vue"),
    meta: { title: "AI分析日志" },
  },
  {
    path: "/ai-analysis-logs/:id",
    name: "AIAnalysisLogDetail",
    component: () => import("@/views/AIAnalysisLogDetail.vue"),
    meta: { title: "AI分析日志详情" },
  },
  {
    path: "/trash",
    name: "Trash",
    component: () => import("@/views/TrashPage.vue"),
   meta: { title: "回收站" },
 },
 {
   path: "/overlay",
   name: "ImageOverlay",
   component: () => import("@/views/ImageOverlay.vue"),
   meta: { title: "图片叠加" },
 },
 {
   path: "/trash/:id",
   name: "TrashImageDetail",
   component: () => import("@/views/TrashImageDetail.vue"),
    meta: { title: "回收站图片详情" },
  },

  // 404
  { path: "/:catchAll(.*)", redirect: { name: "NotFound" } },
];

// 所有的路由
const allRouter = [];
allRouter.push(...productionRouter, ...errorPageRouter);
export default allRouter;
