import { Controller, Get, Query } from '@nestjs/common';
import { AuditService } from './audit.service';

@Controller('audit')
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  findAll(@Query('limit') limit?: string) {
    return this.auditService.findAll(+(limit || 100));
  }

  @Get('by-entity')
  findByEntity(
    @Query('entity') entity: string,
    @Query('entityId') entityId: string,
  ) {
    return this.auditService.findByEntity(entity, +entityId);
  }
}
