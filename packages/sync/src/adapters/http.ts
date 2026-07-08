import type { SyncAdapter, ServerConfig } from './types';
import axios from 'axios';

export function createHTTPAdapter(config: ServerConfig): SyncAdapter {
  const client = axios.create({
    baseURL: config.url,
    auth: config.username && config.password
      ? { username: config.username, password: config.password }
      : undefined,
  });

  const apiPath = `${config.storagePath}/api`;

  return {
    type: 'http',

    async testConnection() {
      try {
        await client.get(`${apiPath}/ping`);
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    },

    async uploadImage(id: number, blob: Blob, metadata: Record<string, unknown>) {
      const formData = new FormData();
      formData.append('file', blob);
      formData.append('metadata', JSON.stringify(metadata));
      await client.post(`${apiPath}/images/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },

    async downloadImage(id: number) {
      try {
        const res = await client.get(`${apiPath}/images/${id}`, {
          responseType: 'json',
        });
        const { blob: b64Blob, metadata } = res.data;
        const byteChars = atob(b64Blob);
        const bytes = new Uint8Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i);
        return { blob: new Blob([bytes]), metadata };
      } catch {
        return null;
      }
    },

    async deleteImage(id: number) {
      await client.delete(`${apiPath}/images/${id}`);
    },

    async listImages() {
      try {
        const res = await client.get(`${apiPath}/images`);
        return res.data as Array<{ id: number; metadata: Record<string, unknown>; version: number }>;
      } catch {
        return [];
      }
    },

    async uploadMetadata(type: string, data: unknown) {
      await client.put(`${apiPath}/metadata/${type}`, data);
    },

    async downloadMetadata(type: string) {
      try {
        const res = await client.get(`${apiPath}/metadata/${type}`);
        return res.data;
      } catch {
        return null;
      }
    },
  };
}
