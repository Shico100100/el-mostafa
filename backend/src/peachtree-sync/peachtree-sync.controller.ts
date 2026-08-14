import { Controller, Get, Post, Put, Body, Logger } from '@nestjs/common';
import { PeachtreeSyncService } from './peachtree-sync.service';
import { SyncEntity } from './dto/sync-status.dto';

const VALID_ENTITIES = new Set(Object.values(SyncEntity));

@Controller('peachtree-sync')
export class PeachtreeSyncController {
  private readonly logger = new Logger(PeachtreeSyncController.name);
  constructor(private syncService: PeachtreeSyncService) {}

  @Post('run')
  runSync(@Body() body: { mode?: 'full' | 'incremental' }) {
    const current = this.syncService.getCurrentSync();
    if (current && current.status === 'running') {
      return {
        message: 'Sync already in progress',
        id: current.id,
        status: current.status,
      };
    }
    const mode = body?.mode === 'incremental' ? 'incremental' : 'full';
    this.syncService.runSync('manual', mode).catch((err) => {
      this.logger.error('Background sync crashed', err?.stack || err);
    });
    return { message: 'Sync started', status: 'running', mode };
  }

  @Post('run-incremental')
  runIncrementalSync() {
    const current = this.syncService.getCurrentSync();
    if (current && current.status === 'running') {
      return {
        message: 'Sync already in progress',
        id: current.id,
        status: current.status,
      };
    }
    this.syncService
      .runSync('manual-incremental', 'incremental')
      .catch((err) => {
        this.logger.error(
          'Background incremental sync crashed',
          err?.stack || err,
        );
      });
    return {
      message: 'Incremental sync started',
      status: 'running',
      mode: 'incremental',
    };
  }

  @Post('run-partial')
  runPartial(@Body() body: { entities?: string[] }) {
    const current = this.syncService.getCurrentSync();
    if (current && current.status === 'running') {
      return {
        message: 'Sync already in progress',
        id: current.id,
        status: current.status,
      };
    }
    const requested = (body.entities || []).filter((e) =>
      VALID_ENTITIES.has(e as SyncEntity),
    );
    if (requested.length === 0) {
      return { message: 'No valid entities provided', status: 'error' };
    }
    this.syncService
      .runSyncPartial(requested as SyncEntity[], 'manual-partial')
      .catch((err) => {
        this.logger.error('Background partial sync crashed', err?.stack || err);
      });
    return {
      message: 'Partial sync started',
      status: 'running',
      entities: requested,
    };
  }

  @Get('status')
  getSyncHistory() {
    return this.syncService.getSyncHistory();
  }

  @Post('test')
  async testConnection() {
    const result = await this.syncService.testConnection();
    return {
      connected: result.connected,
      error: result.error,
      dataPath: this.syncService.getDataPath(),
    };
  }

  @Get('tables')
  async getTables() {
    return this.syncService.getAvailableTables();
  }

  @Get('config')
  getConfig() {
    return { dsn: this.syncService.getDataPath() };
  }

  @Put('config')
  updateConfig(@Body() body: { dsn?: string; dataPath?: string }) {
    const dsn = body.dsn || body.dataPath;
    if (dsn) this.syncService.setDataPath(dsn);
    return { dsn: this.syncService.getDataPath(), message: 'Config updated.' };
  }

  @Post('resync-items')
  resyncItems() {
    const current = this.syncService.getCurrentSync();
    if (current && current.status === 'running') {
      return {
        message: 'Sync already in progress',
        id: current.id,
        status: current.status,
      };
    }
    this.syncService.resyncItems().catch((err) => {
      this.logger.error('Background resync crashed', err?.stack || err);
    });
    return { message: 'Resync started', status: 'running' };
  }

  @Get('last')
  async getLastSync() {
    const current = this.syncService.getCurrentSync();
    if (current && current.status === 'running') return current;
    const history = await this.syncService.getSyncHistory();
    return history.length > 0 ? history[0] : null;
  }

  @Get('progress')
  async getProgress() {
    const current = this.syncService.getCurrentSync();
    if (!current) {
      const history = await this.syncService.getSyncHistory();
      return {
        running: false,
        percentComplete: history.length > 0 ? 100 : 0,
        currentEntity: '',
        status: history.length > 0 ? history[0].status : 'idle',
      };
    }
    return {
      running: current.status === 'running',
      percentComplete: current.percentComplete || 0,
      currentEntity: current.currentEntity || '',
      status: current.status,
      id: current.id,
    };
  }

  @Post('debug')
  async debugInvoiceLink() {
    return this.syncService.debugInvoiceLink();
  }

  @Post('debug-gl')
  async debugGlAccounts() {
    return this.syncService.debugGlAccounts();
  }

  @Post('debug-dry-run')
  async debugDryRunItems() {
    return this.syncService.debugDryRunItems();
  }

  @Post('debug-line-items')
  async debugLineItemMapping() {
    return this.syncService.debugLineItemMapping();
  }
}
