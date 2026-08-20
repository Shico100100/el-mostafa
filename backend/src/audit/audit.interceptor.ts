import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from './audit.service';
import { Reflector } from '@nestjs/core';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    private auditService: AuditService,
    private reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const method = req.method;

    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle();
    }

    const endpoint = `${req.route?.path || ''} ${context.getHandler().name}`;
    const requestPayload =
      req.body != null ? JSON.stringify(req.body).slice(0, 2000) : undefined;
    const userAgent = req.headers?.['user-agent'];
    const entityType = req.route?.path || undefined;

    return next.handle().pipe(
      tap(async (response) => {
        try {
          await this.auditService.log({
            userId: req.user?.id ?? null,
            action:
              method === 'POST'
                ? 'CREATE'
                : method === 'DELETE'
                  ? 'DELETE'
                  : 'UPDATE',
            method,
            endpoint,
            entityId: response?.id != null ? String(response.id) : undefined,
            entityType,
            oldValue: requestPayload,
            newValue:
              typeof response === 'object'
                ? JSON.stringify(response).slice(0, 2000)
                : undefined,
            userAgent,
            ipAddress: req.ip,
          });
        } catch (error) {
          this.logger.error('Audit log failed:', error);
        }
      }),
    );
  }
}
