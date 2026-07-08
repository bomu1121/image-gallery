import type { SyncAdapter, ServerConfig } from './types';
import axios from 'axios';

export function createWebDAVAdapter(config: ServerConfig): SyncAdapter {
  const client = axios.create({
    baseURL: config.url,
    auth: config.username && config.password
      ? { username: config.username, password: config.password }
      : undefined,
    headers: { 'Content-Type': 'application/octet-stream' },
  });

  return {
    type: 'webdav',

    async testConnection() {
      try {
        await client.request({ method: 'PROPFIND', url: '/' });
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    },

    async uploadImage(id: number, blob: Blob, metadata: Record<string, unknown>) {
      const imgPath = `${config.storagePath}/images/${id}`;
      await client.put(imgPath, blob);
      await client.put(`${imgPath}.meta.json`, JSON.stringify(metadata), {
        headers: { 'Content-Type': 'application/json' },
      });
    },

    async downloadImage(id: number) {
      try {
        const imgPath = `${config.storagePath}/images/${id}`;
        const [imgRes, metaRes] = await Promise.all([
          client.get(imgPath, { responseType: 'blob' }),
          client.get(`${imgPath}.meta.json`, { responseType: 'json' }),
        ]);
        return { blob: imgRes.data as Blob, metadata: metaRes.data as Record<string, unknown> };
      } catch {
        return null;
      }
    },

    async deleteImage(id: number) {
      const imgPath = `${config.storagePath}/images/${id}`;
      await client.delete(imgPath).catch(() => {});
      await client.delete(`${imgPath}.meta.json`).catch(() => {});
    },

    async listImages() {
      try {
        const res = await client.request({
          method: 'PROPFIND',
          url: `${config.storagePath}/images/`,
          headers: { Depth: '1' },
        });
        // Simplified: parse XML response to extract image IDs
        return [] as Array<{ id: number; metadata: Record<string, unknown>; version: number }>;
      } catch {
        return [];
      }
    },

    async uploadMetadata(type: string, data: unknown) {
      await client.put(`${config.storagePath}/metadata/${type}.json`, JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' },
      });
    },

    async downloadMetadata(type: string) {
      try {
        const res = await client.get(`${config.storagePath}/metadata/${type}.json`, {
          responseType: 'json',
        });
        return res.data;
      } catch {
        return null;
      }
    },
  };
}
