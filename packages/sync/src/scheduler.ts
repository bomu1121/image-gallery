import type { SyncAdapter, SyncResult } from './adapters/types';

export type SyncCallback = (result: SyncResult) => void;

export class SyncScheduler {
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;

  constructor(
    private adapter: SyncAdapter,
    private intervalMs: number,
    private onSync: SyncCallback,
  ) {}

  start() {
    if (this.timer) return;
    this.timer = setInterval(() => this.run(), this.intervalMs);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  updateInterval(ms: number) {
    this.intervalMs = ms;
    if (this.timer) {
      this.stop();
      this.start();
    }
  }

  async run(): Promise<SyncResult> {
    if (this.running) return { success: false, synced: 0, conflicts: 0, errors: ['Already running'] };
    this.running = true;

    const result: SyncResult = { success: true, synced: 0, conflicts: 0, errors: [] };

    try {
      const connTest = await this.adapter.testConnection();
      if (!connTest.success) {
        result.success = false;
        result.errors.push(`Connection failed: ${connTest.error}`);
      }
    } catch (err: any) {
      result.success = false;
      result.errors.push(err.message);
    } finally {
      this.running = false;
    }

    this.onSync(result);
    return result;
  }

  get isRunning() {
    return this.running;
  }
}
