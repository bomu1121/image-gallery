import axios from "axios";
import { getAllImages, putImage, updateImage, deleteImage } from "../utils/idb";
import { getAllGroups, putGroup, updateGroup, deleteGroup } from "../utils/idb";
import { getBackground, putBackground, deleteBackground } from "../utils/idb";

/**
 * 云同步服务类
 * 负责处理与各种云服务器的数据同步
 */
export class CloudSyncService {
  constructor() {
    this.servers = [];
    this.activeServerId = null;
    this.syncSettings = {};
    this.autoSyncTimer = null;
    this.syncInProgress = false;
  }

  /**
   * 初始化云同步服务
   */
  async initialize(servers = [], activeServerId = null, syncSettings = {}) {
    this.servers = servers;
    this.activeServerId = activeServerId;
    this.syncSettings = syncSettings;

    if (syncSettings.autoSync && activeServerId) {
      this.startAutoSync();
    }
  }

  /**
   * 更新服务器列表
   */
  async updateServers(servers) {
    this.servers = servers;
  }

  /**
   * 设置活动服务器
   */
  async setActiveServer(serverId) {
    this.activeServerId = serverId;

    if (this.syncSettings.autoSync && serverId) {
      this.startAutoSync();
    } else {
      this.stopAutoSync();
    }
  }

  /**
   * 更新同步设置
   */
  async updateSyncSettings(settings) {
    this.syncSettings = { ...this.syncSettings, ...settings };

    if (settings.autoSync && this.activeServerId) {
      this.startAutoSync();
    } else {
      this.stopAutoSync();
    }
  }

  /**
   * 测试服务器连接
   */
  async testConnection(serverConfig) {
    try {
      const adapter = this.createAdapter(serverConfig);
      return await adapter.testConnection();
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 同步数据到指定服务器
   */
  async syncData(serverId) {
    if (this.syncInProgress) {
      throw new Error("同步正在进行中，请稍后再试");
    }

    this.syncInProgress = true;

    try {
      const server = this.servers.find((s) => s.id === serverId);
      if (!server) {
        throw new Error("服务器不存在");
      }

      const adapter = this.createAdapter(server);

      // 同步图片数据
      await this.syncImages(adapter, server);

      // 同步分组数据
      await this.syncGroups(adapter, server);

      // 同步背景设置
      await this.syncBackground(adapter, server);

      return { success: true };
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * 同步图片数据
   */
  async syncImages(adapter, server) {
    try {
      // 获取本地图片数据
      const localImages = await getAllImages();

      // 获取云端图片数据
      const remoteImages = await adapter.getImages();

      // 处理冲突和数据合并
      const { toUpload, toDownload, toUpdate } = this.resolveImageConflicts(
        localImages,
        remoteImages
      );

      // 上传新图片
      for (const image of toUpload) {
        await adapter.uploadImage(image);
      }

      // 下载云端新图片
      for (const image of toDownload) {
        await putImage(image);
      }

      // 更新冲突的图片
      for (const { local, remote } of toUpdate) {
        const resolvedImage = this.resolveImageConflict(local, remote);
        await updateImage(local.id, resolvedImage);
        await adapter.updateImage(local.id, resolvedImage);
      }
    } catch (error) {
      console.error("同步图片数据失败:", error);
      throw error;
    }
  }

  /**
   * 同步分组数据
   */
  async syncGroups(adapter, server) {
    try {
      const localGroups = await getAllGroups();
      const remoteGroups = await adapter.getGroups();

      const { toUpload, toDownload, toUpdate } = this.resolveGroupConflicts(
        localGroups,
        remoteGroups
      );

      for (const group of toUpload) {
        await adapter.uploadGroup(group);
      }

      for (const group of toDownload) {
        await putGroup(group);
      }

      for (const { local, remote } of toUpdate) {
        const resolvedGroup = this.resolveGroupConflict(local, remote);
        await updateGroup(local.id, resolvedGroup);
        await adapter.updateGroup(local.id, resolvedGroup);
      }
    } catch (error) {
      console.error("同步分组数据失败:", error);
      throw error;
    }
  }

  /**
   * 同步背景设置
   */
  async syncBackground(adapter, server) {
    try {
      const localBackground = await getBackground();
      const remoteBackground = await adapter.getBackground();

      if (localBackground && remoteBackground) {
        // 比较时间戳，使用较新的版本
        if (localBackground.createdAt > remoteBackground.createdAt) {
          await adapter.updateBackground(localBackground);
        } else if (remoteBackground.createdAt > localBackground.createdAt) {
          await putBackground(remoteBackground);
        }
      } else if (localBackground && !remoteBackground) {
        await adapter.updateBackground(localBackground);
      } else if (!localBackground && remoteBackground) {
        await putBackground(remoteBackground);
      }
    } catch (error) {
      console.error("同步背景设置失败:", error);
      throw error;
    }
  }

  /**
   * 解决图片冲突
   */
  resolveImageConflicts(localImages, remoteImages) {
    const toUpload = [];
    const toDownload = [];
    const toUpdate = [];

    const localMap = new Map(localImages.map((img) => [img.id, img]));
    const remoteMap = new Map(remoteImages.map((img) => [img.id, img]));

    // 找出需要上传的本地图片
    for (const localImage of localImages) {
      if (!remoteMap.has(localImage.id)) {
        toUpload.push(localImage);
      } else {
        const remoteImage = remoteMap.get(localImage.id);
        if (localImage.createdAt !== remoteImage.createdAt) {
          toUpdate.push({ local: localImage, remote: remoteImage });
        }
      }
    }

    // 找出需要下载的云端图片
    for (const remoteImage of remoteImages) {
      if (!localMap.has(remoteImage.id)) {
        toDownload.push(remoteImage);
      }
    }

    return { toUpload, toDownload, toUpdate };
  }

  /**
   * 解决单个图片冲突
   */
  resolveImageConflict(localImage, remoteImage) {
    switch (this.syncSettings.conflictResolution) {
      case "local":
        return localImage;
      case "remote":
        return remoteImage;
      case "ask":
      default:
        // 默认使用时间戳较新的版本
        return localImage.createdAt > remoteImage.createdAt
          ? localImage
          : remoteImage;
    }
  }

  /**
   * 解决分组冲突
   */
  resolveGroupConflicts(localGroups, remoteGroups) {
    const toUpload = [];
    const toDownload = [];
    const toUpdate = [];

    const localMap = new Map(localGroups.map((group) => [group.id, group]));
    const remoteMap = new Map(remoteGroups.map((group) => [group.id, group]));

    for (const localGroup of localGroups) {
      if (!remoteMap.has(localGroup.id)) {
        toUpload.push(localGroup);
      } else {
        const remoteGroup = remoteMap.get(localGroup.id);
        if (localGroup.createdAt !== remoteGroup.createdAt) {
          toUpdate.push({ local: localGroup, remote: remoteGroup });
        }
      }
    }

    for (const remoteGroup of remoteGroups) {
      if (!localMap.has(remoteGroup.id)) {
        toDownload.push(remoteGroup);
      }
    }

    return { toUpload, toDownload, toUpdate };
  }

  /**
   * 解决单个分组冲突
   */
  resolveGroupConflict(localGroup, remoteGroup) {
    switch (this.syncSettings.conflictResolution) {
      case "local":
        return localGroup;
      case "remote":
        return remoteGroup;
      case "ask":
      default:
        return localGroup.createdAt > remoteGroup.createdAt
          ? localGroup
          : remoteGroup;
    }
  }

  /**
   * 创建适配器
   */
  createAdapter(serverConfig) {
    switch (serverConfig.type) {
      case "webdav":
        return new WebDAVAdapter(serverConfig);
      case "ftp":
        return new FTPAdapter(serverConfig);
      case "sftp":
        return new SFTPAdapter(serverConfig);
      case "http":
        return new HTTPAdapter(serverConfig);
      case "nas":
        return new NASAdapter(serverConfig);
      case "router":
        return new RouterStorageAdapter(serverConfig);
      case "free-cloud":
        return new FreeCloudAdapter(serverConfig);
      default:
        throw new Error(`不支持的服务器类型: ${serverConfig.type}`);
    }
  }

  /**
   * 启动自动同步
   */
  startAutoSync() {
    this.stopAutoSync(); // 先停止现有的定时器

    if (!this.activeServerId) return;

    const interval = this.getSyncInterval();
    if (interval > 0) {
      this.autoSyncTimer = setInterval(async () => {
        try {
          await this.syncData(this.activeServerId);
        } catch (error) {
          console.error("自动同步失败:", error);
        }
      }, interval);
    }
  }

  /**
   * 停止自动同步
   */
  stopAutoSync() {
    if (this.autoSyncTimer) {
      clearInterval(this.autoSyncTimer);
      this.autoSyncTimer = null;
    }
  }

  /**
   * 获取同步间隔（毫秒）
   */
  getSyncInterval() {
    switch (this.syncSettings.syncInterval) {
      case "realtime":
        return 0; // 实时同步，通过事件触发
      case "5min":
        return 5 * 60 * 1000;
      case "15min":
        return 15 * 60 * 1000;
      case "30min":
        return 30 * 60 * 1000;
      case "1hour":
        return 60 * 60 * 1000;
      default:
        return 0;
    }
  }

  /**
   * 销毁服务
   */
  destroy() {
    this.stopAutoSync();
    this.servers = [];
    this.activeServerId = null;
    this.syncSettings = {};
  }
}

/**
 * WebDAV 适配器
 */
class WebDAVAdapter {
  constructor(config) {
    this.config = config;
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.path = config.path || "/images";
    this.username = config.username;
    this.password = config.password;
  }

  async testConnection() {
    try {
      const response = await axios({
        method: "PROPFIND",
        url: `${this.baseUrl}${this.path}`,
        auth: {
          username: this.username,
          password: this.password,
        },
        timeout: 10000,
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getImages() {
    // WebDAV 获取图片列表的实现
    // 这里需要根据具体的 WebDAV 服务器实现
    return [];
  }

  async uploadImage(image) {
    // WebDAV 上传图片的实现
    const imageData = new Blob([image.data], { type: image.type });
    const formData = new FormData();
    formData.append("file", imageData, image.name);

    await axios.put(
      `${this.baseUrl}${this.path}/${image.id}.json`,
      JSON.stringify(image),
      {
        auth: {
          username: this.username,
          password: this.password,
        },
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  async updateImage(imageId, image) {
    await this.uploadImage(image);
  }

  async getGroups() {
    return [];
  }

  async uploadGroup(group) {
    await axios.put(
      `${this.baseUrl}${this.path}/groups/${group.id}.json`,
      JSON.stringify(group),
      {
        auth: {
          username: this.username,
          password: this.password,
        },
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  async updateGroup(groupId, group) {
    await this.uploadGroup(group);
  }

  async getBackground() {
    return null;
  }

  async updateBackground(background) {
    await axios.put(
      `${this.baseUrl}${this.path}/background.json`,
      JSON.stringify(background),
      {
        auth: {
          username: this.username,
          password: this.password,
        },
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}

/**
 * HTTP API 适配器
 */
class HTTPAdapter {
  constructor(config) {
    this.config = config;
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.path = config.path || "/api/images";
    this.username = config.username;
    this.password = config.password;
  }

  async testConnection() {
    try {
      const response = await axios.get(`${this.baseUrl}/health`, {
        auth: {
          username: this.username,
          password: this.password,
        },
        timeout: 10000,
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getImages() {
    const response = await axios.get(`${this.baseUrl}${this.path}`, {
      auth: {
        username: this.username,
        password: this.password,
      },
    });
    return response.data;
  }

  async uploadImage(image) {
    await axios.post(`${this.baseUrl}${this.path}`, image, {
      auth: {
        username: this.username,
        password: this.password,
      },
    });
  }

  async updateImage(imageId, image) {
    await axios.put(`${this.baseUrl}${this.path}/${imageId}`, image, {
      auth: {
        username: this.username,
        password: this.password,
      },
    });
  }

  async getGroups() {
    const response = await axios.get(`${this.baseUrl}/api/groups`, {
      auth: {
        username: this.username,
        password: this.password,
      },
    });
    return response.data;
  }

  async uploadGroup(group) {
    await axios.post(`${this.baseUrl}/api/groups`, group, {
      auth: {
        username: this.username,
        password: this.password,
      },
    });
  }

  async updateGroup(groupId, group) {
    await axios.put(`${this.baseUrl}/api/groups/${groupId}`, group, {
      auth: {
        username: this.username,
        password: this.password,
      },
    });
  }

  async getBackground() {
    try {
      const response = await axios.get(`${this.baseUrl}/api/background`, {
        auth: {
          username: this.username,
          password: this.password,
        },
      });
      return response.data;
    } catch (error) {
      return null;
    }
  }

  async updateBackground(background) {
    await axios.put(`${this.baseUrl}/api/background`, background, {
      auth: {
        username: this.username,
        password: this.password,
      },
    });
  }
}

// FTP 和 SFTP 适配器的基础实现
class FTPAdapter {
  constructor(config) {
    this.config = config;
    // FTP 实现需要额外的库，这里提供基础结构
  }

  async testConnection() {
    // FTP 连接测试实现
    return { success: false, error: "FTP 适配器尚未实现" };
  }
}

class SFTPAdapter {
  constructor(config) {
    this.config = config;
    // SFTP 实现需要额外的库，这里提供基础结构
  }

  async testConnection() {
    // SFTP 连接测试实现
    return { success: false, error: "SFTP 适配器尚未实现" };
  }
}

/**
 * NAS 适配器
 */
class NASAdapter {
  constructor(config) {
    this.config = config;
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.path = config.path || "/images";
    this.username = config.username;
    this.password = config.password;
  }

  async testConnection() {
    try {
      const response = await axios({
        method: "PROPFIND",
        url: `${this.baseUrl}${this.path}`,
        auth: {
          username: this.username,
          password: this.password,
        },
        timeout: 10000,
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getImages() {
    // NAS WebDAV 获取图片列表
    return [];
  }

  async uploadImage(image) {
    await axios.put(
      `${this.baseUrl}${this.path}/${image.id}.json`,
      JSON.stringify(image),
      {
        auth: {
          username: this.username,
          password: this.password,
        },
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  async updateImage(imageId, image) {
    await this.uploadImage(image);
  }

  async getGroups() {
    return [];
  }

  async uploadGroup(group) {
    await axios.put(
      `${this.baseUrl}${this.path}/groups/${group.id}.json`,
      JSON.stringify(group),
      {
        auth: {
          username: this.username,
          password: this.password,
        },
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  async updateGroup(groupId, group) {
    await this.uploadGroup(group);
  }

  async getBackground() {
    return null;
  }

  async updateBackground(background) {
    await axios.put(
      `${this.baseUrl}${this.path}/background.json`,
      JSON.stringify(background),
      {
        auth: {
          username: this.username,
          password: this.password,
        },
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}

/**
 * 路由器存储适配器
 */
class RouterStorageAdapter {
  constructor(config) {
    this.config = config;
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.path = config.path || "/images";
    this.username = config.username;
    this.password = config.password;
  }

  async testConnection() {
    try {
      const response = await axios.get(`${this.baseUrl}/`, {
        auth: {
          username: this.username,
          password: this.password,
        },
        timeout: 10000,
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getImages() {
    // 路由器FTP获取图片列表
    return [];
  }

  async uploadImage(image) {
    // 使用FTP上传到路由器
    const formData = new FormData();
    formData.append(
      "file",
      new Blob([JSON.stringify(image)]),
      `${image.id}.json`
    );

    await axios.post(`${this.baseUrl}${this.path}/`, formData, {
      auth: {
        username: this.username,
        password: this.password,
      },
    });
  }

  async updateImage(imageId, image) {
    await this.uploadImage(image);
  }

  async getGroups() {
    return [];
  }

  async uploadGroup(group) {
    const formData = new FormData();
    formData.append(
      "file",
      new Blob([JSON.stringify(group)]),
      `groups/${group.id}.json`
    );

    await axios.post(`${this.baseUrl}${this.path}/`, formData, {
      auth: {
        username: this.username,
        password: this.password,
      },
    });
  }

  async updateGroup(groupId, group) {
    await this.uploadGroup(group);
  }

  async getBackground() {
    return null;
  }

  async updateBackground(background) {
    const formData = new FormData();
    formData.append(
      "file",
      new Blob([JSON.stringify(background)]),
      "background.json"
    );

    await axios.post(`${this.baseUrl}${this.path}/`, formData, {
      auth: {
        username: this.username,
        password: this.password,
      },
    });
  }
}

/**
 * 免费云存储适配器
 */
class FreeCloudAdapter {
  constructor(config) {
    this.config = config;
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.path = config.path || "/images";
    this.username = config.username;
    this.password = config.password;
  }

  async testConnection() {
    try {
      // 测试云存储连接
      const response = await axios.get(`${this.baseUrl}/`, {
        auth: {
          username: this.username,
          password: this.password,
        },
        timeout: 10000,
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getImages() {
    try {
      const response = await axios.get(`${this.baseUrl}${this.path}/list`, {
        auth: {
          username: this.username,
          password: this.password,
        },
      });
      return response.data || [];
    } catch (error) {
      return [];
    }
  }

  async uploadImage(image) {
    // 压缩图片以减少存储空间
    const compressedImage = await this.compressImage(image);

    await axios.put(
      `${this.baseUrl}${this.path}/${image.id}.json`,
      JSON.stringify(compressedImage),
      {
        auth: {
          username: this.username,
          password: this.password,
        },
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  async updateImage(imageId, image) {
    await this.uploadImage(image);
  }

  async getGroups() {
    try {
      const response = await axios.get(`${this.baseUrl}${this.path}/groups`, {
        auth: {
          username: this.username,
          password: this.password,
        },
      });
      return response.data || [];
    } catch (error) {
      return [];
    }
  }

  async uploadGroup(group) {
    await axios.put(
      `${this.baseUrl}${this.path}/groups/${group.id}.json`,
      JSON.stringify(group),
      {
        auth: {
          username: this.username,
          password: this.password,
        },
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  async updateGroup(groupId, group) {
    await this.uploadGroup(group);
  }

  async getBackground() {
    try {
      const response = await axios.get(
        `${this.baseUrl}${this.path}/background`,
        {
          auth: {
            username: this.username,
            password: this.password,
          },
        }
      );
      return response.data;
    } catch (error) {
      return null;
    }
  }

  async updateBackground(background) {
    await axios.put(
      `${this.baseUrl}${this.path}/background.json`,
      JSON.stringify(background),
      {
        auth: {
          username: this.username,
          password: this.password,
        },
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  // 图片压缩方法
  async compressImage(image) {
    if (image.data && image.data.length > 100000) {
      // 大于100KB才压缩
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();

        return new Promise((resolve) => {
          img.onload = () => {
            // 计算压缩后的尺寸
            const maxWidth = 1920;
            const maxHeight = 1080;
            let { width, height } = img;

            if (width > maxWidth || height > maxHeight) {
              const ratio = Math.min(maxWidth / width, maxHeight / height);
              width *= ratio;
              height *= ratio;
            }

            canvas.width = width;
            canvas.height = height;

            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
              (blob) => {
                const reader = new FileReader();
                reader.onload = () => {
                  resolve({
                    ...image,
                    data: reader.result,
                    compressed: true,
                    originalSize: image.data.length,
                    compressedSize: blob.size,
                  });
                };
                reader.readAsDataURL(blob);
              },
              "image/jpeg",
              0.8
            );
          };
          img.src = image.data;
        });
      } catch (error) {
        console.warn("图片压缩失败，使用原图:", error);
        return image;
      }
    }
    return image;
  }
}
