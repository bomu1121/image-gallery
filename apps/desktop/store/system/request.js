import { defineStore } from "pinia";

export const useSystemRequest = defineStore("systemRequest", {
  state: () => {
    return {
      pendingApis: [],
    };
  },
  getters: {
    getPendingApis() {
      return this.pendingApis;
    },
  },
  actions: {
    // #region --- 同步方法
    // 往挂起队列添加接口
    pushPendingApis(map) {
      this.pendingApis.push(map);
    },
    // 从挂起队列移除指定索引的接口
    removePendingApisByIndex(index) {
      this.pendingApis.splice(index, 1);
    },
    // 清空挂起队列
    emptyPendingApis() {
      this.pendingApis = [];
    },
    // #endregion

    // #region --- 异步方法
    // 往挂起队列添加接口
    pushPendingApisAsync(map) {
      return new Promise((resolve) => {
        this.pushPendingApis(map);
        resolve();
      });
    },
    // 挂起队列中移除指定设置CancelToken的接口
    removePendingApisAsync(cancelToken) {
      return new Promise((resolve) => {
        const index = this.pendingApis.findIndex((item) => {
          const { token } = item.source;
          return toRaw(token) === cancelToken;
        });
        if (index !== -1) this.removePendingApisByIndex(index);
        resolve();
      });
    },
    // 终止所有未完成请求
    cancelAllPendingApisAsync() {
      return new Promise((resolve) => {
        if (this.pendingApis.length) {
          this.pendingApis.forEach((item) => item.source.cancel());
          this.emptyPendingApis();
        }
        resolve();
      });
    },
    // #endregion
  },
});
