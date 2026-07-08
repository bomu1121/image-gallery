export interface ImageRecord {
  id?: number;
  name: string;
  size: number;
  type: string;
  width: number;
  height: number;
  blob: Blob;
  thumbnail?: Blob;
  groupId?: number;
  tags: string[];
  addedAt: number;
  updatedAt: number;
  parentImageId?: number;
}

export interface GroupRecord {
  id?: number;
  name: string;
  description: string;
  imageCount: number;
  createdAt: number;
  updatedAt: number;
  sortOrder?: number;
}

export interface AlbumRecord {
  id?: number;
  name: string;
  createdAt: number;
  updatedAt: number;
}

export interface AlbumItemRecord {
  id?: number;
  albumId: number;
  imageId: number;
  sortOrder: number;
}

export interface TrashRecord {
  id?: number;
  originalImage: ImageRecord;
  deletedAt: number;
}

export interface BackgroundRecord {
  id?: number;
  image: Blob;
  opacity: number;
  createdAt: number;
}

export interface AnalysisLogRecord {
  id?: number;
  imageName: string;
  aiService: string;
  status: 'success' | 'error' | 'pending';
  timestamp: number;
  tags: string[];
  description: string;
  rawResponse?: unknown;
}
