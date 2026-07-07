import { db } from '../schema';
import type { AlbumRecord, AlbumItemRecord } from '@gallery/shared/types';

export const albumsRepo = {
  async getAll(): Promise<AlbumRecord[]> {
    return db.albums.orderBy('updatedAt').reverse().toArray();
  },

  async getById(id: number): Promise<AlbumRecord | undefined> {
    return db.albums.get(id);
  },

  async put(album: AlbumRecord): Promise<number> {
    return db.albums.put(album);
  },

  async update(id: number, changes: Partial<AlbumRecord>): Promise<number> {
    return db.albums.update(id, changes);
  },

  async delete(id: number): Promise<void> {
    await db.albumItems.where('albumId').equals(id).delete();
    return db.albums.delete(id);
  },
};

export const albumItemsRepo = {
  async getByAlbum(albumId: number): Promise<AlbumItemRecord[]> {
    return db.albumItems
      .where('albumId')
      .equals(albumId)
      .sortBy('sortOrder');
  },

  async addItem(item: AlbumItemRecord): Promise<number> {
    return db.albumItems.put(item);
  },

  async removeItem(id: number): Promise<void> {
    return db.albumItems.delete(id);
  },

  async removeByAlbumAndImage(albumId: number, imageId: number): Promise<void> {
    const items = await db.albumItems
      .where('[albumId+imageId]')
      .equals([albumId, imageId])
      .toArray();
    const ids = items.map((i) => i.id!).filter((id): id is number => id !== undefined);
    if (ids.length > 0) {
      return db.albumItems.bulkDelete(ids);
    }
  },
};

export const analysisLogsRepo = {
  async getAll() {
    return db.analysisLogs.orderBy('timestamp').reverse().toArray();
  },

  async getById(id: number) {
    return db.analysisLogs.get(id);
  },

  async put(log: import('@gallery/shared/types').AnalysisLogRecord): Promise<number> {
    return db.analysisLogs.put(log);
  },

  async delete(id: number): Promise<void> {
    return db.analysisLogs.delete(id);
  },

  async clearAll(): Promise<void> {
    return db.analysisLogs.clear();
  },
};
