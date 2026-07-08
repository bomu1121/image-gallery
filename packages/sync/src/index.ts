import type { SyncAdapter, SyncResult, ServerConfig, SyncSettings, ConflictResolution } from './adapters/types';

// Adapter factory
import { createWebDAVAdapter } from './adapters/webdav';
import { createHTTPAdapter } from './adapters/http';

export type { SyncAdapter, SyncResult, ServerConfig, SyncSettings, ConflictResolution };

export function createSyncAdapter(config: ServerConfig): SyncAdapter {
  switch (config.type) {
    case 'webdav':
      return createWebDAVAdapter(config);
    case 'http':
    case 'ftp':
    case 'sftp':
      return createHTTPAdapter(config);
    default:
      throw new Error(`Unsupported server type: ${config.type}`);
  }
}

export { SyncScheduler } from './scheduler';
export { resolveConflict } from './conflict';
