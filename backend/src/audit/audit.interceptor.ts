import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from './audit.service';
import { Reflector } from '@nestjs/core';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private auditService: AuditService,
    private reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method = req.method;

    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(async (response) => {
        try {
          const userId = req.user?.id;
          if (!userId) return;
          await this.auditService.log({
            userId,
            action: method === 'POST' ? 'CREATE' : method === 'DELETE' ? 'DELETE' : 'UPDATE',
            method,
            endpoint: `${req.route?.path || ''} ${context.getHandler().name}`,
            entityId: response?.id != null ? String(response.id) : undefined,
            payload: typeof response === 'object' ? JSON.stringify(response).slice(0, 2000) : undefined,
            ipAddress: req.ip,
          });
        } catch (error) {
          console.error('Audit log failed:', error);
        }
      }),
    );
  }
}
