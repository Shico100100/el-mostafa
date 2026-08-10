import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

const aliasMap: Record<string, string> = {
  '/api/v1/inventory/stock-movements': '/api/v1/inventory/stock/movements',
  '/api/v1/inventory/raw-materials': '/api/v1/manufacturing/raw-materials',
  '/api/v1/manufacturing/daily-production': '/api/v1/manufacturing/production',
  '/api/v1/accounting/journal-entries': '/api/v1/accounting/journal',
  '/api/v1/attendance': '/api/v1/manufacturing/attendance',
  '/api/v1/purchases/payments': '/api/v1/purchases/suppliers',
  '/api/v1/sales/payments': '/api/v1/sales/customers',
  '/api/v1/dashboard/recent-activity': '/api/v1/dashboard/stats',
};

// Sorted by length descending so longer paths match first (e.g. production-schedules/123 matches before production-schedules)
const aliasKeys = Object.keys(aliasMap).sort((a, b) => b.length - a.length);

@Injectable()
export class RouteAliasesMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const basePath = req.path.split('?')[0];
    for (const key of aliasKeys) {
      if (basePath === key || basePath.startsWith(key + '/')) {
        req.url = req.originalUrl.replace(key, aliasMap[key]);
        break;
      }
    }
    next();
  }
}
