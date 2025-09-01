import axios from "axios";
import set from "@/set.js";
import storage from "@/utils/storage";
import router from "@/router";
import {
  apiDuplicateRemoval,
  fileDownload,
  errorCreate,
  errStatusHanding,
  errCodeHanding,
} from "./utils";

const CancelToken = axios.CancelToken; // 申明CancelToken

// 创建一个 axios 实例
const service = axios.create({
  // 开发环境: proxy 代理访问服务器, 正式环境: 项目与服务端代码部署在一个域
  baseURL:
    import.meta.env.VITE_APP_BASE_URL +
    import.meta.env.VITE_APP_API_PUBLIC_PREFIX,
  timeout: "", // 请求超时时间
});

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // cancelToken
    const source = CancelToken.source(); // 申明CancelToken,也可new CancelToken.source()实例一个
    config.cancelToken = source.token; // 将实例对象的token赋予该请求
    // 设置请求头
    // 语言
    const lang = storage.getSystemLang() || set.lang;
    config.headers.lang = lang;
    return config;
  },
  (error) => {
    errorCreate(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    const { status, data, config } = response;

    // 文件下载
    if (config.responseType) {
      fileDownload(response);
      return;
    }

    // 返回数据给调用源
    if (status === 200) {
      if (data.code === "0" || !data.code) return data;
      errorCreate({
        code: "ERR_RES_DATA",
        message: `接口:[${config.url}]返回的数据不是约定的数据`,
        name: "resDataError",
      });
    } else
      errorCreate({
        code: "ERR_RES_STATUS",
        message: `接口:[${config.url}]返回数据的 status 异常, 不为200`,
        name: "resStatusError",
      });
  },
  (error) => {
    const { config, response, code } = error;
    // 浏览器端抛出错误
    if (!response) {
      if (code) errCodeHanding(code);
      errorCreate(error);
    }
    // 后端抛出问题
    const { status } = response;
    if (status) errStatusHanding(response);
    errorCreate(error);
  }
);

export default service;
