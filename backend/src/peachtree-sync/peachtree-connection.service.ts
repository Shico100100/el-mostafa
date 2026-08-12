import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const execFileAsync = promisify(execFile);

@Injectable()
export class PeachtreeConnectionService {
  private readonly logger = new Logger(PeachtreeConnectionService.name);
  private dataPath: string;
  private serverName: string;
  private psScript: string;
  private queryCache = new Map<string, any[]>();
  private cacheEnabled = false;

  private readonly defaultDataPath: string;
  private resolvedDatabaseName: string | null = null;
  private lastTestResult: { connected: boolean; error?: string; at: number } | null = null;

  constructor(private configService: ConfigService) {
    this.defaultDataPath = this.configService.get<string>('PEACHTREE_DATA_PATH', 'mos');
    this.dataPath = this.defaultDataPath;
    this.serverName = this.configService.get<string>('PEACHTREE_SERVER', 'localhost');
    this.psScript = path.join(process.cwd(), 'peachtree-query.ps1');
  }

  enableCache(): void {
    this.queryCache.clear();
    this.cacheEnabled = true;
  }

  disableCache(): void {
    this.queryCache.clear();
    this.cacheEnabled = false;
  }

  private getCacheKey(table: string, limit: number, fields?: string, where?: string): string {
    return `${table}|${limit}|${fields || ''}|${where || ''}`;
  }

  async query(table: string, limit = 0, fields?: string, where?: string, retries = 3): Promise<any[]> {
    const cacheKey = this.getCacheKey(table, limit, fields, where);
    if (this.cacheEnabled && this.queryCache.has(cacheKey)) {
      this.logger.log(`Cache hit: ${table} (${this.queryCache.get(cacheKey)!.length} rows)`);
      return this.queryCache.get(cacheKey)!;
    }

    const psPath = 'C:\\Windows\\SysWOW64\\WindowsPowerShell\\v1.0\\powershell.exe';
    const args = [
      '-ExecutionPolicy', 'Bypass',
      '-NoProfile',
      '-File', this.psScript,
      '-Table', table,
      '-ServerName', this.serverName,
      '-Database', this.dataPath,
    ];
    if (limit > 0) {
      args.push('-Limit', String(limit));
    }
    if (fields) {
      args.push('-Fields', fields);
    }
    if (where) {
      args.push('-Where', where);
    }

    this.logger.log(`Querying Peachtree table: ${table}${where ? ` (${where})` : ''}`);

    try {
      const { stdout, stderr } = await execFileAsync(
        psPath,
        args,
        { timeout: 300000, maxBuffer: 256 * 1024 * 1024, encoding: 'utf8' },
      );

      if (stderr && stderr.trim()) {
        this.logger.warn(`PowerShell stderr: ${stderr.trim()}`);
      }

      const output = stdout.trim();
      if (!output) return [];

      let parsed: any[];
      try {
        const json = JSON.parse(output);
        parsed = Array.isArray(json) ? json : [json];
      } catch {
        this.logger.error(`Failed to parse JSON output: ${output.substring(0, 200)}`);
        throw new Error(`Peachtree query failed for table ${table}: ${output.substring(0, 500)}`);
      }

      if (this.cacheEnabled) {
        this.queryCache.set(cacheKey, parsed);
      }

      return parsed;
    } catch (error: any) {
      if (retries > 0 && error?.message?.includes('too many clients')) {
        const delay = (4 - retries) * 2000;
        this.logger.warn(`Connection pool exhausted for ${table}, retrying in ${delay}ms (${retries} retries left)`);
        await new Promise(r => setTimeout(r, delay));
        return this.query(table, limit, fields, where, retries - 1);
      }
      throw error;
    }
  }

  private async ensurePervasiveRunning(): Promise<void> {
    const serviceNames = ['psqlWGE', 'Pervasive.SQL', 'Pervasive.SQL (relational)', 'Pervasive.SQL (transactional)'];
    for (const svc of serviceNames) {
      try {
        const { stdout } = await execFileAsync('sc', ['query', svc], { timeout: 10000, encoding: 'utf8' });
        if (stdout.includes('RUNNING')) {
          this.logger.log(`Pervasive service "${svc}" is running`);
          return;
        }
        this.logger.log(`Pervasive service "${svc}" found but not running, starting...`);
        await execFileAsync('net', ['start', svc], { timeout: 10000, encoding: 'utf8' });
        this.logger.log(`Pervasive service "${svc}" started successfully`);
        return;
      } catch {
        continue;
      }
    }
    this.logger.warn('No known Pervasive PSQL service found — it may not be installed');
  }

  private isFilePath(value: string): boolean {
    return /^[A-Z]:\\|^\//i.test(value.trim());
  }

  private async resolveDatabaseName(input: string): Promise<string> {
    const trimmed = input.trim();
    if (!this.isFilePath(trimmed)) return trimmed;
    if (this.resolvedDatabaseName) {
      this.logger.log(`Using cached resolved database name: "${this.resolvedDatabaseName}"`);
      return this.resolvedDatabaseName;
    }

    this.logger.log(`Input "${trimmed}" looks like a file path, resolving Pervasive database name...`);

    const psScript = path.join(process.cwd(), 'peachtree-resolve-db.ps1');
    let resolved = '';
    try {
      const psPath = 'C:\\Windows\\SysWOW64\\WindowsPowerShell\\v1.0\\powershell.exe';
      const { stdout } = await execFileAsync(
        psPath,
        ['-ExecutionPolicy', 'Bypass', '-NoProfile', '-File', psScript, '-DataPath', trimmed],
        { timeout: 30000, encoding: 'utf8' },
      );
      resolved = stdout.trim();
      if (resolved) {
        this.logger.log(`Resolved Pervasive database name: "${resolved}"`);
        this.resolvedDatabaseName = resolved;
        return resolved;
      }
    } catch (e: any) {
      this.logger.warn(`Auto-resolve failed: ${e.message}`);
    }

    this.logger.log(`Falling back to default database name: "${this.defaultDataPath}"`);
    this.resolvedDatabaseName = this.defaultDataPath;
    return this.defaultDataPath;
  }

  async testConnection(): Promise<{ connected: boolean; error?: string }> {
    const now = Date.now();
    if (
      this.lastTestResult &&
      this.lastTestResult.connected &&
      now - this.lastTestResult.at < 60000
    ) {
      this.logger.log('Returning cached Peachtree connection test result');
      return { connected: true };
    }

    await this.ensurePervasiveRunning();

    const resolvedDb = await this.resolveDatabaseName(this.dataPath);
    if (resolvedDb !== this.dataPath) {
      this.logger.log(`Auto-corrected database name: "${this.dataPath}" -> "${resolvedDb}"`);
      this.dataPath = resolvedDb;
    }

    try {
      const rows = await this.query('Chart', 1);
      this.logger.log(`Peachtree connection test passed - GLAccount rows: ${rows.length}`);
      this.lastTestResult = { connected: true, at: Date.now() };
      return { connected: true };
    } catch (error: any) {
      const msg = error?.message || String(error);
      this.logger.error('Peachtree connection test failed', msg);
      this.lastTestResult = { connected: false, error: msg, at: Date.now() };
      return { connected: false, error: msg };
    }
  }

  async getTableNames(): Promise<string[]> {
    const tables = [
      'Chart', 'Customers', 'Vendors', 'LineItem',
      'JrnlHdr', 'JrnlRow', 'BOMItems',
      'Budgets', 'BankRecords', 'Employee', 'Phase',
      'TaxTable', 'Jobs', 'Company',
    ];
    return tables;
  }

  getDataPath(): string {
    return this.dataPath || this.defaultDataPath;
  }

  setDataPath(dataPath: string): void {
    if (dataPath && dataPath.trim()) {
      this.dataPath = dataPath.trim();
    }
  }

  getServerName(): string {
    return this.serverName;
  }
}
