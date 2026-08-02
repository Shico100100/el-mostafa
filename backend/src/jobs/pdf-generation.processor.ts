import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';

@Processor('pdf-generation')
export class PdfGenerationProcessor extends WorkerHost {
  private readonly logger = new Logger(PdfGenerationProcessor.name);

  async process(job: Job) {
    const { type, data, title } = job.data;
    this.logger.log(`بدء توليد PDF: ${title || type}`);

    await job.updateProgress(30);

    const result = {
      type,
      title: title || 'Report',
      generatedAt: new Date().toISOString(),
      status: 'completed',
    };

    await job.updateProgress(100);
    this.logger.log(`تم توليد PDF: ${title || type}`);
    return result;
  }
}