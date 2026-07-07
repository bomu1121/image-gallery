import { db } from '../schema';
import type { ImageRecord } from '@gallery/shared/types';

export const imagesRepo = {
  async getAll(): Promise<ImageRecord[]> {
    return db.images.orderBy('addedAt').reverse().toArray();
  },

  async getById(id: number): Promise<ImageRecord | undefined> {
    return db.images.get(id);
  },

  async getByGroup(groupId: number): Promise<ImageRecord[]> {
    return db.images.where('groupId').equals(groupId).toArray();
  },

  async getChildren(parentId: number): Promise<ImageRecord[]> {
    return db.images.where('parentImageId').equals(parentId).toArray();
  },

  async put(image: ImageRecord): Promise<number> {
    return db.images.put(image);
  },

  async update(id: number, changes: Partial<ImageRecord>): Promise<number> {
    return db.images.update(id, changes);
  },

  async delete(id: number): Promise<void> {
    return db.images.delete(id);
  },

  async batchDelete(ids: number[]): Promise<void> {
    return db.images.bulkDelete(ids);
  },

  async searchByName(name: string): Promise<ImageRecord[]> {
    return db.images
      .filter((img) => img.name.toLowerCase().includes(name.toLowerCase()))
      .toArray();
  },
};
