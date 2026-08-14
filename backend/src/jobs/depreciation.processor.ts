import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';

@Processor('depreciation')
export class DepreciationProcessor extends WorkerHost {
  private readonly logger = new Logger(DepreciationProcessor.name);

  async process(job: Job) {
    const { machineId, startDate, endDate, machineName } = job.data;
    this.logger.log(`بدء حساب إهلاك الماكينة: ${machineName || machineId}`);

    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    const years = totalDays / 365;

    const purchasePrice = job.data.purchasePrice || 0;
    const usefulLife = job.data.usefulLife || 10;
    const salvageValue = job.data.salvageValue || 0;

    const annualDepreciation = (purchasePrice - salvageValue) / usefulLife;
    const depreciationAmount =
      Math.round(annualDepreciation * years * 100) / 100;

    await job.updateProgress(50);

    const result = {
      machineId,
      machineName: machineName || 'Unknown',
      period: { start: startDate, end: endDate },
      purchasePrice,
      usefulLife,
      salvageValue,
      annualDepreciation: Math.round(annualDepreciation * 100) / 100,
      depreciationAmount,
      bookValue: Math.round((purchasePrice - depreciationAmount) * 100) / 100,
    };

    await job.updateProgress(100);
    this.logger.log(
      `اكتمل حساب إهلاك ${machineName || machineId}: ${depreciationAmount}`,
    );
    return result;
  }
}
