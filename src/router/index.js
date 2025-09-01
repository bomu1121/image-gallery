import { createRouter, createWebHashHistory } from "vue-router";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import routes from "./routes";

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

router.beforeEach(async (to, from, next) => {
  NProgress.start();
  next();
});

/* eslint-disable */
router.afterEach((to) => {
  NProgress.done();
});

export default router;
