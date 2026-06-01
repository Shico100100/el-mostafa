import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    @InjectRepository(AuditLog)
    private auditRepo: Repository<AuditLog>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, user, ip } = request;

    // Only log data-modifying operations
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      return next.handle().pipe(
        tap(async () => {
          try {
            const log = this.auditRepo.create({
              user_id: user?.id || null,
              action: this.getReadableAction(method, url),
              method,
              endpoint: url,
              payload:
                method !== 'DELETE'
                  ? JSON.stringify(body).substring(0, 1000)
                  : undefined,
              ip_address: ip || undefined,
              entity_id: (
                body?.id?.toString() ||
                url.split('/').pop() ||
                ''
              ).substring(0, 255),
            });
            await this.auditRepo.save(log);
          } catch (error) {
            console.error('Failed to save audit log:', error);
          }
        }),
      );
    }

    return next.handle();
  }

  private getReadableAction(method: string, url: string): string {
    const parts = url.split('/').filter((p) => p && !p.match(/^\d+$/));
    const entity = parts.pop() || 'system';

    switch (method) {
      case 'POST':
        return `إضافة ${entity}`;
      case 'PUT':
      case 'PATCH':
        return `تعديل ${entity}`;
      case 'DELETE':
        return `حذف ${entity}`;
      default:
        return `${method} ${url}`;
    }
  }
}
