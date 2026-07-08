import type { ConflictResolution } from './adapters/types';

export function resolveConflict<T extends { updatedAt: number }>(
  localItem: T,
  remoteItem: T,
  strategy: ConflictResolution,
): T {
  switch (strategy) {
    case 'local':
      return localItem;
    case 'remote':
      return remoteItem;
    case 'ask':
    default:
      // Default to newest
      return localItem.updatedAt >= remoteItem.updatedAt ? localItem : remoteItem;
  }
}
