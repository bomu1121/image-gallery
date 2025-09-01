import request from "@/plugin/request";
/**
 *
 * @param {*} url 请求地址
 * @param {*} params 参数
 * @param {*} data 参数
 * @param {*} config 添加入 request 中 config 的参数,详见附表一
 * @returns
 */
export const get = (url, params = {}, config = {}) =>
  request({ url, method: "get", params, ...config });
export const post = (url, data = {}, config = {}) =>
  request({ url, method: "post", data, ...config });
export const del = (url, data = {}, config = {}) =>
  request({ url, method: "delete", params: data, data, ...config });
export const put = (url, data = {}, config = {}) =>
  request({ url, method: "put", data, ...config });
// 下载文件
export const getDown = (url, params = {}, config = {}) =>
  request({
    url,
    method: "get",
    params,
    responseType: "arraybuffer", // 或 'blob'
    ...config,
  });

// 示例
// export const getTypes = (v, c) => get(prefix + '/types', v, c);

// 导出excel
// export const excelExport = (v, c) => getDownExcel('/analyze/ExcelExport', v, c);

export * from "./modules/option.js";
