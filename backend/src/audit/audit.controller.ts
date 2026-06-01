import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';

@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleEnum.admin)
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  getLogs(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.auditService.getLogs(+(page || 1), +(limit || 50));
  }
}
