import { Controller, Get } from '@nestjs/common';
import { ReconciliationService } from './reconciliation.service';

@Controller('accounting/reconciliation')
export class ReconciliationController {
  constructor(private readonly reconciliationService: ReconciliationService) {}

  @Get()
  reconcile() {
    return this.reconciliationService.getSummary();
  }
}
