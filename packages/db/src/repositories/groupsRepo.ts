import { db } from '../schema';
import type { GroupRecord } from '@gallery/shared/types';

export const groupsRepo = {
  async getAll(): Promise<GroupRecord[]> {
    return db.groups.orderBy('createdAt').toArray();
  },

  async getById(id: number): Promise<GroupRecord | undefined> {
    return db.groups.get(id);
  },

  async put(group: GroupRecord): Promise<number> {
    return db.groups.put(group);
  },

  async update(id: number, changes: Partial<GroupRecord>): Promise<number> {
    return db.groups.update(id, changes);
  },

  async delete(id: number): Promise<void> {
    return db.groups.delete(id);
  },

  async bulkDelete(ids: number[]): Promise<void> {
    return db.groups.bulkDelete(ids);
  },
};

export const trashRepo = {
  async getAll(): Promise<import('@gallery/shared/types').TrashRecord[]> {
    return db.trash.orderBy('deletedAt').reverse().toArray();
  },

  async getById(id: number) {
    return db.trash.get(id);
  },

  async put(record: import('@gallery/shared/types').TrashRecord): Promise<number> {
    return db.trash.put(record);
  },

  async delete(id: number): Promise<void> {
    return db.trash.delete(id);
  },

  async batchDelete(ids: number[]): Promise<void> {
    return db.trash.bulkDelete(ids);
  },

  async clearAll(): Promise<void> {
    return db.trash.clear();
  },
};

export const backgroundRepo = {
  async get(): Promise<import('@gallery/shared/types').BackgroundRecord | undefined> {
    return db.background.orderBy('createdAt').last();
  },

  async put(record: import('@gallery/shared/types').BackgroundRecord): Promise<number> {
    return db.background.put(record);
  },

  async delete(id: number): Promise<void> {
    return db.background.delete(id);
  },

  async clearAll(): Promise<void> {
    return db.background.clear();
  },
};
