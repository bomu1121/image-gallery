import router from "@/router";
import { useSystemRequest } from "@/store/system/request.js";
import { downBlob } from "@/utils";
import { isEqual } from "lodash";
import ElMessage from "@/plugin/CusMessage.js";

// #region --- 异常
// 创建错误
export const errorCreate = (error) => {
  console.error(error);
  throw error;
};
// 异常错误处理
export const errCodeHanding = (code) => {
  code === "ERR_CANCELED" && activeCancel();
  code === "ERR_NETWORK" && networkAnomaly();
};
// 主动取消请求
const activeCancel = () => {};
// 网络异常,请求异常
const networkAnomaly = () => {
  ElMessage.error("网络异常请检查网络连接");
};
// 异常状态处理
export const errStatusHanding = (response) => {
  const { status, data } = response;
  // 40101 登录已失效，请重新登录
  // 40105 用户未找到
  status === 401 && LoginExpiration();
  ElMessage.error(data.msg || "系统异常");
};
// 登录过期
const LoginExpiration = () => {};

// #endregion

// #region --- 同请求终止挂起的那个请求
export const apiDuplicateRemoval = (config) => {
  const store = useSystemRequest();
  const apis = toRaw(store.getPendingApis);
  // 获取重复api
  const api = apis.find((item) => {
    return dataIsEqual(config, item.config);
  });
  if (api) {
    // 移除队列与终止请求
    api.source.cancel();
    api.config && store.removePendingApisAsync(api.config.cancelToken);
  }
};
// 指定数据相等
const dataIsEqual = (config, pendingApiConfig) => {
  const {
    url,
    method,
    data,
    params,
    // 自定义属性
    pendingSole,
  } = config;
  const { url: u, method: m, data: d, params: p } = pendingApiConfig;
  if (u === url && m === method) {
    if (pendingSole) return true;
    return isEqual(data, d) && isEqual(params, p);
  }
  return false;
};
// #endregion

// #region --- 文件下载
export const fileDownload = (response) => {
  const { data, config, headers } = response;
  // 获取文件名
  // 注意: 后端配置了response.setHeader("Access-Control-Expose-Headers", "Content-Disposition"),才能从content-disposition拿到文件名
  const filename = headers["content-disposition"]
    ? headers["content-disposition"].split("=")[1]
    : "file";
  downBlob(data, decodeURI(filename), config.contentType);
};
// #endregion
