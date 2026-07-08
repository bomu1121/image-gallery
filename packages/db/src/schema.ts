import Dexie, { type Table } from 'dexie';
import type {
  ImageRecord,
  GroupRecord,
  AlbumRecord,
  AlbumItemRecord,
  TrashRecord,
  BackgroundRecord,
  AnalysisLogRecord,
} from '@gallery/shared/types';

export class GalleryDB extends Dexie {
  images!: Table<ImageRecord, number>;
  groups!: Table<GroupRecord, number>;
  albums!: Table<AlbumRecord, number>;
  albumItems!: Table<AlbumItemRecord, number>;
  trash!: Table<TrashRecord, number>;
  background!: Table<BackgroundRecord, number>;
  analysisLogs!: Table<AnalysisLogRecord, number>;

  constructor() {
    super('image_gallery_db');

    this.version(2).stores({
      images: '++id, name, groupId, addedAt, *tags, parentImageId',
      groups: '++id, name, createdAt',
      albums: '++id, name, updatedAt',
      albumItems: '++id, albumId, imageId, [albumId+imageId], [albumId+sortOrder]',
      trash: '++id, deletedAt',
      background: '++id, createdAt',
      analysisLogs: '++id, timestamp, imageName, aiService, status',
    });
  }
}

export const db = new GalleryDB();
export type { ImageRecord, GroupRecord, AlbumRecord, AlbumItemRecord, TrashRecord, BackgroundRecord, AnalysisLogRecord };
