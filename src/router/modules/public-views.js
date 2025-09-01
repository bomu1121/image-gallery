export default [
  {
    path: "list/details",
    component: () =>
      import("@/views/public-views/public-list-details/index.vue"),
    meta: {
      title: "列表详情",
      isDetailsView: true,
    },
  },
  {
    path: "page",
    component: () => import("@/views/public-views/public-page/index.vue"),
    meta: {
      title: "单篇类型",
    },
  },
];
