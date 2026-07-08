export type ServerType = 'webdav' | 'http' | 'ftp' | 'sftp' | 'custom';

export type ConflictResolution = 'local' | 'remote' | 'ask';

export interface ServerConfig {
  id: string;
  name: string;
  type: ServerType;
  url: string;
  username?: string;
  password?: string;
  storagePath: string;
}

export interface SyncSettings {
  autoSync: boolean;
  syncInterval: number; // milliseconds
  conflictResolution: ConflictResolution;
}

export interface SyncItem {
  id: number;
  type: 'image' | 'group' | 'album' | 'background' | 'analysisLog';
  localVersion: number;  // timestamp
  remoteVersion: number; // timestamp
  data: unknown;
}

export interface SyncResult {
  success: boolean;
  synced: number;
  conflicts: number;
  errors: string[];
}

export interface SyncAdapter {
  readonly type: ServerType;
  testConnection(): Promise<{ success: boolean; error?: string }>;
  uploadImage(id: number, blob: Blob, metadata: Record<string, unknown>): Promise<void>;
  downloadImage(id: number): Promise<{ blob: Blob; metadata: Record<string, unknown> } | null>;
  deleteImage(id: number): Promise<void>;
  listImages(): Promise<Array<{ id: number; metadata: Record<string, unknown>; version: number }>>;
  uploadMetadata(type: string, data: unknown): Promise<void>;
  downloadMetadata(type: string): Promise<unknown | null>;
}
