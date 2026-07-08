import { describe, it, expect } from 'vitest';
import { createSyncAdapter, resolveConflict, SyncScheduler } from '../index';

describe('Sync Package', () => {
  it('should create WebDAV adapter', () => {
    const adapter = createSyncAdapter({
      id: '1',
      name: 'Test',
      type: 'webdav',
      url: 'https://example.com',
      storagePath: '/data',
    });
    expect(adapter.type).toBe('webdav');
  });

  it('should create HTTP adapter', () => {
    const adapter = createSyncAdapter({
      id: '2',
      name: 'Test HTTP',
      type: 'http',
      url: 'https://example.com',
      storagePath: '/data',
    });
    expect(adapter.type).toBe('http');
  });

  it('should throw for unknown adapter type', () => {
    expect(() =>
      createSyncAdapter({
        id: '3',
        name: 'Unknown',
        type: 'custom',
        url: '',
        storagePath: '',
      }),
    ).toThrow('Unsupported server type');
  });

  describe('Conflict Resolution', () => {
    it('should prefer local when strategy is local', () => {
      const local = { id: 1, name: 'local', updatedAt: 100 };
      const remote = { id: 1, name: 'remote', updatedAt: 200 };
      expect(resolveConflict(local, remote, 'local')).toBe(local);
    });

    it('should prefer remote when strategy is remote', () => {
      const local = { id: 1, name: 'local', updatedAt: 100 };
      const remote = { id: 1, name: 'remote', updatedAt: 200 };
      expect(resolveConflict(local, remote, 'remote')).toBe(remote);
    });

    it('should prefer newest when strategy is ask', () => {
      const older = { id: 1, name: 'old', updatedAt: 100 };
      const newer = { id: 1, name: 'new', updatedAt: 200 };
      expect(resolveConflict(older, newer, 'ask')).toBe(newer);
    });
  });

  describe('SyncScheduler', () => {
    it('should start and stop without errors', () => {
      const adapter = createSyncAdapter({
        id: 's',
        name: 'S',
        type: 'webdav',
        url: 'https://example.com',
        storagePath: '/',
      });
      const scheduler = new SyncScheduler(adapter, 99999, () => {});
      scheduler.start();
      expect(scheduler.isRunning).toBe(false);
      scheduler.stop();
    });
  });
});
