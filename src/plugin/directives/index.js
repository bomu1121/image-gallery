import popTip from "./pop-tip/index.js";
import "./pop-tip/style.less";

export const initDirectives = (app) => {
  app.directive("popTip", popTip);
};
